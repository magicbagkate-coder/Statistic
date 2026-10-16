import type { sheets_v4 } from '@googleapis/sheets';

import { hexToColor } from '@/sheets/hexToColor';
import {
  blockStarts,
  blockWidth,
  DATA_FIRST_ROW,
  FIRST_BLOCK_COLUMN,
  GRID_ROWS,
  HEADER_ROWS,
  LABEL_FONT_SIZE,
  ORDERS_COLOR,
  SOURCE_BLOCKS,
  totalColumn,
  TOTAL_HEADERS,
  TOTAL_PERCENT_OFFSETS,
} from '@/sheets/sheetLayout';

type Request = sheets_v4.Schema$Request;
type Range = { rowFrom: number; rowTo: number; columnFrom: number; columnTo: number };

export function gridRange(sheetId: number, range: Range): sheets_v4.Schema$GridRange {
  return {
    sheetId,
    startRowIndex: range.rowFrom,
    endRowIndex: range.rowTo,
    startColumnIndex: range.columnFrom,
    endColumnIndex: range.columnTo,
  };
}

function merge(sheetId: number, range: Range): Request {
  return { mergeCells: { range: gridRange(sheetId, range), mergeType: 'MERGE_ALL' } };
}

function paint(sheetId: number, request: { range: Range; color: string; bold?: boolean }): Request {
  return {
    repeatCell: {
      range: gridRange(sheetId, request.range),
      cell: {
        userEnteredFormat: {
          backgroundColor: hexToColor(request.color),
          horizontalAlignment: 'CENTER',
          verticalAlignment: 'MIDDLE',
          textFormat: { bold: Boolean(request.bold) },
          wrapStrategy: 'WRAP',
        },
      },
      fields: 'userEnteredFormat(backgroundColor,horizontalAlignment,verticalAlignment,textFormat,wrapStrategy)',
    },
  };
}

function numberFormat(sheetId: number, request: { range: Range; type: 'PERCENT' | 'DATE'; pattern: string }): Request {
  return {
    repeatCell: {
      range: gridRange(sheetId, request.range),
      cell: { userEnteredFormat: { numberFormat: { type: request.type, pattern: request.pattern }, horizontalAlignment: 'CENTER' } },
      fields: 'userEnteredFormat(numberFormat,horizontalAlignment)',
    },
  };
}

function bold(sheetId: number, range: Range): Request {
  return {
    repeatCell: {
      range: gridRange(sheetId, range),
      cell: { userEnteredFormat: { textFormat: { bold: true } } },
      fields: 'userEnteredFormat.textFormat.bold',
    },
  };
}

/** Date and shift labels: bold, size 12, centered both ways (the date sits in the middle of its three rows). */
function labelFormat(sheetId: number): Request {
  return {
    repeatCell: {
      range: gridRange(sheetId, { rowFrom: DATA_FIRST_ROW - 1, rowTo: GRID_ROWS, columnFrom: 0, columnTo: FIRST_BLOCK_COLUMN }),
      cell: {
        userEnteredFormat: {
          textFormat: { bold: true, fontSize: LABEL_FONT_SIZE },
          horizontalAlignment: 'CENTER',
          verticalAlignment: 'MIDDLE',
        },
      },
      fields: 'userEnteredFormat(textFormat,horizontalAlignment,verticalAlignment)',
    },
  };
}

function column(index: number): Range {
  return { rowFrom: DATA_FIRST_ROW - 1, rowTo: GRID_ROWS, columnFrom: index, columnTo: index + 1 };
}

function blockRequests(sheetId: number, request: { start: number; index: number }): Request[] {
  const block = SOURCE_BLOCKS[request.index];
  const width = blockWidth(block);
  const ordersColumn = request.start + (block.withTarget ? 2 : 1);
  const percentColumns = block.withTarget ? [request.start + 3, request.start + 4] : [request.start + 2];
  return [
    merge(sheetId, { rowFrom: 0, rowTo: 1, columnFrom: request.start, columnTo: request.start + width }),
    paint(sheetId, { range: { rowFrom: 0, rowTo: HEADER_ROWS, columnFrom: request.start, columnTo: request.start + width }, color: block.color, bold: true }),
    paint(sheetId, { range: column(ordersColumn), color: ORDERS_COLOR }),
    ...percentColumns.map((index) => numberFormat(sheetId, { range: column(index), type: 'PERCENT', pattern: '0.00%' })),
  ];
}

/** Everything that makes an empty sheet look like the table: merged and coloured headers, formats, frozen header. */
export function buildLayoutRequests(sheetId: number): Request[] {
  const totalIndexes = TOTAL_HEADERS.map((_header, offset) => totalColumn() + offset);
  return [
    merge(sheetId, { rowFrom: 0, rowTo: HEADER_ROWS, columnFrom: 0, columnTo: 1 }),
    merge(sheetId, { rowFrom: 0, rowTo: HEADER_ROWS, columnFrom: 1, columnTo: FIRST_BLOCK_COLUMN }),
    paint(sheetId, { range: { rowFrom: 0, rowTo: HEADER_ROWS, columnFrom: 0, columnTo: FIRST_BLOCK_COLUMN }, color: '#ffffff', bold: true }),
    ...totalIndexes.flatMap((index) => [
      merge(sheetId, { rowFrom: 0, rowTo: HEADER_ROWS, columnFrom: index, columnTo: index + 1 }),
      paint(sheetId, { range: { rowFrom: 0, rowTo: HEADER_ROWS, columnFrom: index, columnTo: index + 1 }, color: '#ffffff', bold: true }),
    ]),
    numberFormat(sheetId, { range: column(0), type: 'DATE', pattern: 'd/m' }),
    ...totalIndexes.map((index) => bold(sheetId, column(index))),
    labelFormat(sheetId),
    ...TOTAL_PERCENT_OFFSETS.map((offset) => numberFormat(sheetId, { range: column(totalColumn() + offset), type: 'PERCENT', pattern: '0.00%' })),
    ...blockStarts().flatMap((start, index) => blockRequests(sheetId, { start, index })),
    { updateSheetProperties: { properties: { sheetId, gridProperties: { frozenRowCount: HEADER_ROWS, frozenColumnCount: FIRST_BLOCK_COLUMN } }, fields: 'gridProperties(frozenRowCount,frozenColumnCount)' } },
  ];
}

import { describe, expect, it } from 'vitest';

import { buildLayoutRequests } from '@/sheets/buildLayoutRequests';
import { DATA_FIRST_ROW, totalColumn, TOTAL_HEADERS } from '@/sheets/sheetLayout';

const requests = buildLayoutRequests(0);
const cellFormats = requests.flatMap((request) => (request.repeatCell ? [request.repeatCell] : []));

describe('buildLayoutRequests', () => {
  it('makes the numbers of the closing total columns bold', () => {
    const boldColumns = cellFormats
      .filter((cell) => cell.fields === 'userEnteredFormat.textFormat.bold')
      .map((cell) => cell.range?.startColumnIndex);
    expect(boldColumns).toEqual(TOTAL_HEADERS.map((_header, offset) => totalColumn() + offset));
  });

  it('formats the date and shift labels of the data rows: bold, size 12, centered in the middle', () => {
    const labels = cellFormats.filter((cell) => cell.range?.startRowIndex === DATA_FIRST_ROW - 1 && cell.range.startColumnIndex === 0 && cell.range.endColumnIndex === 2);
    expect(labels.map((cell) => cell.cell?.userEnteredFormat?.textFormat)).toContainEqual({ bold: true, fontSize: 12 });
    expect(labels.map((cell) => cell.cell?.userEnteredFormat?.verticalAlignment)).toContain('MIDDLE');
  });

  it('freezes the two header rows and the first two columns', () => {
    const freeze = requests.find((request) => request.updateSheetProperties);
    expect(freeze?.updateSheetProperties?.properties?.gridProperties).toEqual({ frozenRowCount: 2, frozenColumnCount: 2 });
  });
});

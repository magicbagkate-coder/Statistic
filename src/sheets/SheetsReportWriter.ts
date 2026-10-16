import { Injectable } from '@nestjs/common';

import type { DayReport } from '@/types/DayReport';
import type { ReportRow } from '@/types/ReportRow';
import type { ShiftReport } from '@/types/ShiftReport';

import { buildHeaderValues } from '@/sheets/buildHeaderValues';
import { buildLayoutRequests, gridRange } from '@/sheets/buildLayoutRequests';
import { buildRowValues } from '@/sheets/buildRowValues';
import { hexToColor } from '@/sheets/hexToColor';
import { sheetDateSerial } from '@/sheets/sheetDateSerial';
import { DATA_FIRST_ROW, DAY_LABEL, DAY_ROW_COLOR, FIRST_BLOCK_COLUMN, GROUP_LABELS, totalColumn, TOTAL_HEADERS } from '@/sheets/sheetLayout';
import { SheetsClient } from '@/sheets/SheetsClient';

type SheetRef = { title: string; sheetId: number };
type RowRequest = { date: string; label: string; rows: ReportRow[]; totals: { leads: number; target: number; orders: number } };

@Injectable()
export class SheetsReportWriter {
  constructor(private readonly client: SheetsClient) {}

  /** Writes the shift's row of its date into the table (three rows per date: shift 1, shift 2, the day). */
  writeShift(report: ShiftReport): Promise<void> {
    return this.writeRow({
      date: report.date,
      label: String(report.shift),
      rows: report.rows,
      totals: { leads: report.leads, target: report.target, orders: report.orders },
    });
  }

  writeDay(report: DayReport): Promise<void> {
    return this.writeRow({
      date: report.date,
      label: DAY_LABEL,
      rows: report.rows,
      totals: { leads: report.leads, target: report.target, orders: report.orders },
    });
  }

  /** Empties the table sheet (values, merges, formats) so the layout is built again by the next write. */
  async reset(): Promise<void> {
    await this.client.clearSheet(await this.client.firstSheet());
  }

  private async writeRow(request: RowRequest): Promise<void> {
    const sheet = await this.client.firstSheet();
    await this.ensureLayout(sheet);
    const groupStart = await this.findOrCreateGroup({ sheet, date: request.date });
    const row = groupStart + GROUP_LABELS.indexOf(request.label);
    const values = [buildRowValues({ rows: request.rows, totals: request.totals })];
    await this.client.writeValues({ range: `'${sheet.title}'!${this.columnName(FIRST_BLOCK_COLUMN)}${row}`, values });
  }

  /** Builds the headers and formats when the sheet is still empty. */
  private async ensureLayout(sheet: SheetRef): Promise<void> {
    const corner = await this.client.readValues(`'${sheet.title}'!A1`);
    if (corner.length > 0) return;
    await this.client.writeValues({ range: `'${sheet.title}'!A1`, values: buildHeaderValues() });
    await this.client.batchUpdate(buildLayoutRequests(sheet.sheetId));
  }

  /** The first row (1-based) of the three rows of a date; the group is added at the bottom when the date is new. */
  private async findOrCreateGroup(request: { sheet: SheetRef; date: string }): Promise<number> {
    const { sheet, date } = request;
    const serial = sheetDateSerial(date);
    const existing = await this.client.readValues(`'${sheet.title}'!A${DATA_FIRST_ROW}:B`);
    const index = existing.findIndex((row) => row[0] === serial);
    if (index >= 0) return DATA_FIRST_ROW + index;
    const start = DATA_FIRST_ROW + existing.length;
    await this.createGroup({ sheet, start, serial });
    return start;
  }

  private async createGroup(request: { sheet: SheetRef; start: number; serial: number }): Promise<void> {
    const { sheet, start, serial } = request;
    const labels = GROUP_LABELS.map((label, index) => [index === 0 ? serial : '', label]);
    await this.client.writeValues({ range: `'${sheet.title}'!A${start}`, values: labels });
    await this.client.batchUpdate([
      { mergeCells: { range: gridRange(sheet.sheetId, { rowFrom: start - 1, rowTo: start - 1 + GROUP_LABELS.length, columnFrom: 0, columnTo: 1 }), mergeType: 'MERGE_ALL' } },
      {
        repeatCell: {
          range: gridRange(sheet.sheetId, { rowFrom: start + 1, rowTo: start + 2, columnFrom: 0, columnTo: totalColumn() + TOTAL_HEADERS.length }),
          cell: { userEnteredFormat: { backgroundColor: hexToColor(DAY_ROW_COLOR), horizontalAlignment: 'CENTER' } },
          fields: 'userEnteredFormat(backgroundColor,horizontalAlignment)',
        },
      },
    ]);
  }

  private columnName(index: number): string {
    return String.fromCharCode('A'.charCodeAt(0) + index);
  }
}

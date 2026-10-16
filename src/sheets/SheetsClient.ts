import { auth, sheets } from '@googleapis/sheets';
import { Injectable } from '@nestjs/common';

import type { sheets_v4 } from '@googleapis/sheets';
import type { SpreadsheetInfo } from '@/types/SpreadsheetInfo';

import { AppConfigService } from '@/config/AppConfigService';

const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

/** A thin wrapper over the Google Sheets API for the data spreadsheet. */
@Injectable()
export class SheetsClient {
  private api?: sheets_v4.Sheets;

  constructor(private readonly appConfig: AppConfigService) {}

  /** The title of the data spreadsheet and the names of its sheets: a quick check that the service account has access. */
  async describeSpreadsheet(): Promise<SpreadsheetInfo> {
    const response = await this.client().spreadsheets.get({
      spreadsheetId: this.spreadsheetId(),
      fields: 'properties.title,sheets.properties.title',
    });
    const spreadsheet = response.data;
    return {
      title: spreadsheet.properties?.title ?? '',
      sheets: (spreadsheet.sheets ?? []).map((sheet) => sheet.properties?.title ?? ''),
    };
  }

  /** The first sheet of the spreadsheet, where the table lives. */
  async firstSheet(): Promise<{ title: string; sheetId: number }> {
    const response = await this.client().spreadsheets.get({ spreadsheetId: this.spreadsheetId(), fields: 'sheets.properties(title,sheetId)' });
    const sheet = (response.data.sheets ?? [])[0];
    if (!sheet?.properties) throw new Error('The spreadsheet has no sheets');
    return { title: String(sheet.properties.title), sheetId: Number(sheet.properties.sheetId) };
  }

  /** Reads raw values (dates come back as numbers); trailing empty rows are not returned. */
  async readValues(range: string): Promise<(string | number)[][]> {
    const response = await this.client().spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId(),
      range,
      valueRenderOption: 'UNFORMATTED_VALUE',
    });
    return (response.data.values ?? []) as (string | number)[][];
  }

  async writeValues(request: { range: string; values: (string | number)[][] }): Promise<void> {
    await this.client().spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId(),
      range: request.range,
      valueInputOption: 'RAW',
      requestBody: { values: request.values },
    });
  }

  /** Removes everything from a sheet: values, merged cells and formatting. */
  async clearSheet(sheet: { title: string; sheetId: number }): Promise<void> {
    await this.client().spreadsheets.values.clear({ spreadsheetId: this.spreadsheetId(), range: `'${sheet.title}'` });
    await this.batchUpdate([
      { unmergeCells: { range: { sheetId: sheet.sheetId } } },
      { repeatCell: { range: { sheetId: sheet.sheetId }, cell: {}, fields: 'userEnteredFormat' } },
    ]);
  }

  async batchUpdate(requests: sheets_v4.Schema$Request[]): Promise<void> {
    await this.client().spreadsheets.batchUpdate({ spreadsheetId: this.spreadsheetId(), requestBody: { requests } });
  }

  private spreadsheetId(): string {
    return this.appConfig.config.googleSpreadsheetId;
  }

  private client(): sheets_v4.Sheets {
    this.api ??= sheets({
      version: 'v4',
      auth: new auth.GoogleAuth({ keyFile: this.appConfig.config.googleCredentialsPath, scopes: [SHEETS_SCOPE] }),
    });
    return this.api;
  }
}

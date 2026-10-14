import { parse } from 'csv-parse/sync';

/** Downloads one tab of a link-shared Google Sheet as rows of cells. */
export async function fetchSheetRows(request: { spreadsheetId: string; tab: string }): Promise<string[][]> {
  const tab = encodeURIComponent(request.tab);
  const url = `https://docs.google.com/spreadsheets/d/${request.spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${tab}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Google Sheet tab "${request.tab}" request failed with HTTP ${response.status}`);
  return parse(await response.text(), { relax_column_count: true }) as string[][];
}

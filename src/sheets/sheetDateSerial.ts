const MILLIS_PER_DAY = 86_400_000;
const SHEETS_EPOCH = Date.UTC(1899, 11, 30);

/** The number Google Sheets uses for a date (days since 30.12.1899), from YYYY-MM-DD. */
export function sheetDateSerial(date: string): number {
  return (Date.parse(`${date}T00:00:00Z`) - SHEETS_EPOCH) / MILLIS_PER_DAY;
}

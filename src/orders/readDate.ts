export const DATE_PATTERN = /(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?/;
const SHORT_YEAR_LENGTH = 2;

function normalizeYear(rawYear: string | undefined, fallbackYear: string): string {
  if (!rawYear) return fallbackYear;
  return rawYear.length === SHORT_YEAR_LENGTH ? `20${rawYear}` : rawYear;
}

/** Finds a date like 14.10, 14.10.26 or 14.10.2026 in a text and returns it as YYYY-MM-DD. */
export function readDate(text: string, fallbackYear: string): string | undefined {
  const match = DATE_PATTERN.exec(text);
  if (!match) return undefined;
  return `${normalizeYear(match[3], fallbackYear)}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
}

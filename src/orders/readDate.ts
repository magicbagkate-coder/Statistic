/** A date like 14.10, 14-10, 14/10 or 14.10.26: a day, then a month from 1 to 12 (so times such as 16.30 are not dates). */
export const DATE_PATTERN = /(?<!\d)(\d{1,2})[./-](0?[1-9]|1[0-2])(?!\d)(?:[./-](\d{2,4}))?/;
const SHORT_YEAR_LENGTH = 2;

function normalizeYear(rawYear: string | undefined, fallbackYear: string): string {
  if (!rawYear) return fallbackYear;
  return rawYear.length === SHORT_YEAR_LENGTH ? `20${rawYear}` : rawYear;
}

/** Finds a date in a text and returns it as YYYY-MM-DD. */
export function readDate(text: string, fallbackYear: string): string | undefined {
  const match = DATE_PATTERN.exec(text);
  if (!match) return undefined;
  return `${normalizeYear(match[3], fallbackYear)}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
}

import type { OrderCaption } from '@/types/OrderCaption';
import type { ParsedMessage } from '@/types/ParsedMessage';

const DATE_PATTERN = /(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?/;
const SHIFT_PATTERN = /смен[аы]?\s*([12])/i;
const LEADER_PATTERN = /руководител[ьяю]\s+([^\n,]+)/i;
const ORDER_PATTERN = /^\s*(\d{6,})\s*$/;
const SHORT_YEAR_LENGTH = 2;

function normalizeYear(rawYear: string | undefined, fallbackYear: string): string {
  if (!rawYear) return fallbackYear;
  return rawYear.length === SHORT_YEAR_LENGTH ? `20${rawYear}` : rawYear;
}

function readLeader(text: string): string {
  const match = LEADER_PATTERN.exec(text);
  return match ? match[1].trim() : '';
}

function readCaption(text: string, fallbackYear: string): OrderCaption | undefined {
  const date = DATE_PATTERN.exec(text);
  const shift = SHIFT_PATTERN.exec(text);
  if (!date || !shift) return undefined;
  const year = normalizeYear(date[3], fallbackYear);
  return {
    date: `${year}-${date[2].padStart(2, '0')}-${date[1].padStart(2, '0')}`,
    shift: shift[1] === '1' ? 1 : 2,
    leader: readLeader(text),
  };
}

/** Splits a message into an optional caption (date + shift [+ leader]) and the order numbers written one per line. */
export function parseOrderMessage(text: string, fallbackYear: string): ParsedMessage {
  const lines = text.split('\n');
  const orderIds = lines
    .map((line) => ORDER_PATTERN.exec(line))
    .filter((match) => match !== null)
    .map((match) => Number(match[1]));
  const captionText = lines.filter((line) => !ORDER_PATTERN.test(line)).join(' ');
  return { caption: readCaption(captionText, fallbackYear), orderIds };
}

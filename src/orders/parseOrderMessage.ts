import type { OrderCaption } from '@/types/OrderCaption';
import type { ParsedMessage } from '@/types/ParsedMessage';

import { DATE_PATTERN, readDate } from '@/orders/readDate';

const SHIFT_PATTERN = /смен[аы]?\s*([12])/i;
const LEADER_WORD = /руководител[ьяю]/i;
const ORDER_PATTERN = /^\s*(\d{6,})(?:\s*\(\s*\d+\s*\))?\s*$/;
const EDGE_PUNCTUATION = /^[\s,.;:()-]+|[\s,.;:()-]+$/g;

/** The leader is whatever is left of the caption after the date, the shift and the word "руководитель". */
function readLeader(text: string): string {
  return text.replace(DATE_PATTERN, ' ').replace(SHIFT_PATTERN, ' ').replace(LEADER_WORD, ' ').replace(EDGE_PUNCTUATION, '').trim();
}

function readCaption(text: string, fallbackYear: string): OrderCaption | undefined {
  const date = readDate(text, fallbackYear);
  const shift = SHIFT_PATTERN.exec(text);
  if (!date || !shift) return undefined;
  return { date, shift: shift[1] === '1' ? 1 : 2, leader: readLeader(text) };
}

/**
 * Splits a message into an optional caption (date + shift [+ leader]) and the order numbers, one per line.
 * A line may carry the short order number in brackets after the internal one, e.g. "8808297 (19689)".
 */
export function parseOrderMessage(text: string, fallbackYear: string): ParsedMessage {
  const lines = text.split('\n');
  const orderIds = lines
    .map((line) => ORDER_PATTERN.exec(line))
    .filter((match) => match !== null)
    .map((match) => Number(match[1]));
  const captionText = lines.filter((line) => !ORDER_PATTERN.test(line)).join(' ');
  return { caption: readCaption(captionText, fallbackYear), orderIds };
}

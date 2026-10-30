import type { ParsedLive } from '@/types/ParsedLive';

import { DATE_PATTERN, readDate } from '@/orders/readDate';

const LIVE_PATTERN = /прям[а-яё]*\s+эфир/i;
const ORDER_WORD = /заказ/i;
/** The words that start the exchange and TikTok counts a message may carry under the live stream count. */
const OTHER_COUNTS = /обмен|тик\s*-?\s*ток|tik\s*-?\s*tok/i;
/** The count is a short standalone number; order numbers (4+ digits, also in brackets) are not counts. */
const COUNT_PATTERN = /(?<!\d)(\d{1,3})(?!\d)/;

/** The text from the live stream words to the start of the exchange or TikTok count, if there is one. */
function liveSection(text: string): string | undefined {
  const start = text.search(LIVE_PATTERN);
  if (start < 0) return undefined;
  const rest = text.slice(start);
  const end = rest.search(OTHER_COUNTS);
  return end < 0 ? rest : rest.slice(0, end);
}

/**
 * Reads a message like "15.10, Алина, Прямой эфир - 5 заказов": the number of live stream orders.
 * The order numbers that may follow in the same message are ignored, and so are the exchange and TikTok counts.
 */
export function parseLiveOrders(text: string, fallbackYear: string): ParsedLive | undefined {
  const section = liveSection(text);
  if (!section || !ORDER_WORD.test(text)) return undefined;
  const count = COUNT_PATTERN.exec(section.replace(DATE_PATTERN, ' '));
  if (!count) return undefined;
  return { count: Number(count[1]), date: readDate(text, fallbackYear) };
}

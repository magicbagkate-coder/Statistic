import type { ParsedLive } from '@/types/ParsedLive';

import { DATE_PATTERN, readDate } from '@/orders/readDate';

const LIVE_PATTERN = /прям[а-яё]*\s+эфир/i;
const ORDER_WORD = /заказ/i;
/** The words that start the exchange and TikTok counts a message may carry under the live stream count. */
const OTHER_COUNTS = /обмен|тик\s*-?\s*ток|tik\s*-?\s*tok/i;
/** The count is a short standalone number; order numbers (4+ digits, also in brackets) are not counts. */
const COUNT_PATTERN = /(?<!\d)(\d{1,3})(?!\d)/;
/** A count written right after the words ("Прямой эфир - 2", no word about orders needed); not a time like 16:00 or a date. */
const DIRECT_COUNT = /эфир[\s:–—-]*(?<!\d)(\d{1,3})(?!\d|:|\.\d)/i;

/** The text from the live stream words to the start of the exchange or TikTok count, if there is one. */
function liveSection(text: string): string | undefined {
  const start = text.search(LIVE_PATTERN);
  if (start < 0) return undefined;
  const rest = text.slice(start);
  const end = rest.search(OTHER_COUNTS);
  return end < 0 ? rest : rest.slice(0, end);
}

/** The number right after the live stream words, else (when the message speaks of orders) the first short number of the section. */
function readCount(request: { section: string; hasOrderWord: boolean }): number | undefined {
  const { section, hasOrderWord } = request;
  const direct = DIRECT_COUNT.exec(section);
  if (direct) return Number(direct[1]);
  const listed = hasOrderWord ? COUNT_PATTERN.exec(section.replace(DATE_PATTERN, ' ')) : null;
  return listed ? Number(listed[1]) : undefined;
}

/**
 * Reads a message like "15.10, Алина, Прямой эфир - 5 заказов" (or just "Прямой эфир - 5"): the number of live stream orders.
 * The order numbers that may follow in the same message are ignored, and so are the exchange and TikTok counts.
 */
export function parseLiveOrders(text: string, fallbackYear: string): ParsedLive | undefined {
  const section = liveSection(text);
  if (!section) return undefined;
  const count = readCount({ section, hasOrderWord: ORDER_WORD.test(text) });
  if (count === undefined) return undefined;
  return { count, date: readDate(text, fallbackYear) };
}

import type { ParsedLive } from '@/types/ParsedLive';

import { DATE_PATTERN, readDate } from '@/orders/readDate';

const LIVE_PATTERN = /прям[а-яё]*\s+эфир/i;
const ORDER_WORD = /заказ/i;
/** The count is a short standalone number; order numbers (4+ digits, also in brackets) are not counts. */
const COUNT_PATTERN = /(?<!\d)(\d{1,3})(?!\d)/;

/**
 * Reads a message like "15.10, Алина, Прямой эфир - 5 заказов": the number of live stream orders.
 * The order numbers that may follow in the same message are ignored.
 */
export function parseLiveOrders(text: string, fallbackYear: string): ParsedLive | undefined {
  if (!LIVE_PATTERN.test(text) || !ORDER_WORD.test(text)) return undefined;
  const count = COUNT_PATTERN.exec(text.replace(DATE_PATTERN, ' '));
  if (!count) return undefined;
  return { count: Number(count[1]), date: readDate(text, fallbackYear) };
}

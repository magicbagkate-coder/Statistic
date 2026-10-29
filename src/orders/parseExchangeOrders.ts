import type { ParsedLive } from '@/types/ParsedLive';

import { DATE_PATTERN, readDate } from '@/orders/readDate';

const EXCHANGE_PATTERN = /обмен/i;
/** The count is a short standalone number; order numbers (4+ digits, also in brackets) are not counts. */
const COUNT_PATTERN = /(?<!\d)(\d{1,3})(?!\d)/;

/**
 * Reads a message like "15.10, Алина, Обмены - 2 заказа": the number of exchange orders of the day.
 * The order numbers that may follow in the same message are ignored.
 */
export function parseExchangeOrders(text: string, fallbackYear: string): ParsedLive | undefined {
  if (!EXCHANGE_PATTERN.test(text)) return undefined;
  const count = COUNT_PATTERN.exec(text.replace(DATE_PATTERN, ' '));
  if (!count) return undefined;
  return { count: Number(count[1]), date: readDate(text, fallbackYear) };
}

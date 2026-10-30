import type { ParsedLive } from '@/types/ParsedLive';

import { readDate } from '@/orders/readDate';

/** The count is a short number written right after the word, so the order numbers that follow are not counts. */
const EXCHANGE_COUNT = /обмен[а-яё]*[^\d\n]{0,15}(?<!\d)(\d{1,3})(?!\d)/i;

/**
 * Reads a message like "15.10, Алина, Обмены - 2 заказа": the number of exchange orders of the day.
 * The line may also stand under the live stream count in the same message; the order numbers after it are ignored.
 */
export function parseExchangeOrders(text: string, fallbackYear: string): ParsedLive | undefined {
  const count = EXCHANGE_COUNT.exec(text);
  if (!count) return undefined;
  return { count: Number(count[1]), date: readDate(text, fallbackYear) };
}

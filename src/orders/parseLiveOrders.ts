import { DATE_PATTERN, readDate } from '@/orders/readDate';

const LIVE_PATTERN = /прям[а-яё]*\s+эфир/i;
const ORDER_WORD = /заказ/i;
const NUMBER_PATTERN = /(\d+)/;

/** Reads a message like "заказы прямой эфир 7" (optionally with a date): the number of live stream orders. */
export function parseLiveOrders(text: string, fallbackYear: string): { count: number; date?: string } | undefined {
  if (!LIVE_PATTERN.test(text) || !ORDER_WORD.test(text)) return undefined;
  const number = NUMBER_PATTERN.exec(text.replace(DATE_PATTERN, ' '));
  if (!number) return undefined;
  return { count: Number(number[1]), date: readDate(text, fallbackYear) };
}

import type { ParsedLive } from '@/types/ParsedLive';

import { readDate } from '@/orders/readDate';

/** The count is a short number written right after the word, so order numbers and the "(Тикток)" source of an unnumbered order are not counts. */
const TIKTOK_COUNT = /(?:тик\s*-?\s*ток|tik\s*-?\s*tok)[^\d\n]{0,15}(?<!\d)(\d{1,3})(?!\d)/i;

/**
 * Reads the number of TikTok status orders of the day from a message like "15.10, Алина, Тикток - 2 заказа";
 * the line may stand under the live stream count in the same message.
 */
export function parseTiktokOrders(text: string, fallbackYear: string): ParsedLive | undefined {
  const count = TIKTOK_COUNT.exec(text);
  if (!count) return undefined;
  return { count: Number(count[1]), date: readDate(text, fallbackYear) };
}

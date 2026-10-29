import type { LiveOrders } from '@/types/LiveOrders';

/** An exchange count is kept this long: a late or corrected message still updates the day it is about. */
export const EXCHANGES_KEEP_MS = 7 * 24 * 60 * 60 * 1000;

export function dropStaleExchanges(exchanges: LiveOrders[], now: number): LiveOrders[] {
  return exchanges.filter((entry) => now - entry.lastMessageAt < EXCHANGES_KEEP_MS);
}

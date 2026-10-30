import type { LiveOrders } from '@/types/LiveOrders';

/** An exchange or TikTok count is kept this long: a late or corrected message still updates the day it is about. */
export const COUNTS_KEEP_MS = 7 * 24 * 60 * 60 * 1000;

export function dropStaleCounts(counts: LiveOrders[], now: number): LiveOrders[] {
  return counts.filter((entry) => now - entry.lastMessageAt < COUNTS_KEEP_MS);
}

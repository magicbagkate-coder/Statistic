import type { OrderBatch } from '@/types/OrderBatch';

import { batchHasOrders } from '@/orders/batchHasOrders';

/** A caption that never got any order numbers is forgotten after this long, so it cannot catch later lists. */
export const STALE_EMPTY_BATCH_MS = 12 * 60 * 60 * 1000;

export function dropStaleBatches(batches: OrderBatch[], now: number): OrderBatch[] {
  return batches.filter((batch) => batchHasOrders(batch) || now - batch.lastMessageAt < STALE_EMPTY_BATCH_MS);
}

import type { OrderBatch } from '@/types/OrderBatch';

import { batchOrderIds } from '@/orders/batchOrderIds';

/** A batch is complete after five minutes without new messages in the orders group. */
export const QUIET_PERIOD_MS = 5 * 60 * 1000;

export function splitReadyBatches(batches: OrderBatch[], now: number): { ready: OrderBatch[]; waiting: OrderBatch[] } {
  const isReady = (batch: OrderBatch): boolean => batchOrderIds(batch).length > 0 && now - batch.lastMessageAt >= QUIET_PERIOD_MS;
  return { ready: batches.filter(isReady), waiting: batches.filter((batch) => !isReady(batch)) };
}

import type { OrderBatch } from '@/types/OrderBatch';

/** All distinct order ids of a batch, across the messages it was built from. */
export function batchOrderIds(batch: OrderBatch): number[] {
  return [...new Set(batch.parts.flatMap((part) => part.orderIds))];
}

import type { OrderBatch } from '@/types/OrderBatch';

/** The source of every "no order number yet" line of a batch, one entry per line. */
export function batchUnnumbered(batch: OrderBatch): string[] {
  return batch.parts.flatMap((part) => part.unnumbered ?? []);
}

import type { OrderBatch } from '@/types/OrderBatch';

import { batchOrderIds } from '@/orders/batchOrderIds';
import { batchUnnumbered } from '@/orders/batchUnnumbered';

/** A batch has orders when it lists at least one order number or one order without a number yet. */
export function batchHasOrders(batch: OrderBatch): boolean {
  return batchOrderIds(batch).length > 0 || batchUnnumbered(batch).length > 0;
}

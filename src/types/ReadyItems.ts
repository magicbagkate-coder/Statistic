import type { LiveOrders } from '@/types/LiveOrders';
import type { OrderBatch } from '@/types/OrderBatch';
import type { PlanEntry } from '@/types/PlanEntry';

export type ReadyItems = {
  batches: OrderBatch[];
  liveOrders: LiveOrders[];
  plans: PlanEntry[];
};

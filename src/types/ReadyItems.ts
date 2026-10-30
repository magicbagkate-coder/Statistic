import type { LiveOrders } from '@/types/LiveOrders';
import type { OrderBatch } from '@/types/OrderBatch';

export type ReadyItems = {
  batches: OrderBatch[];
  liveOrders: LiveOrders[];
  exchanges: LiveOrders[];
  tiktok: LiveOrders[];
};

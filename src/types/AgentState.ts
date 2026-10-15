import type { LiveOrders } from '@/types/LiveOrders';
import type { OrderBatch } from '@/types/OrderBatch';

export type AgentState = {
  offset: number;
  batches: OrderBatch[];
  liveOrders: LiveOrders[];
  reminders: string[];
};

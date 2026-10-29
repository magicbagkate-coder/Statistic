import type { LiveOrders } from '@/types/LiveOrders';
import type { OrderBatch } from '@/types/OrderBatch';

export type AgentState = {
  offset: number;
  batches: OrderBatch[];
  liveOrders: LiveOrders[];
  /** The exchange counts of the days, kept for a week so that a late message can still update its day. */
  exchanges: LiveOrders[];
  reminders: string[];
};

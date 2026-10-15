import type { LiveOrders } from '@/types/LiveOrders';
import type { OrderBatch } from '@/types/OrderBatch';
import type { PlanEntry } from '@/types/PlanEntry';

export type AgentState = {
  offset: number;
  batches: OrderBatch[];
  liveOrders: LiveOrders[];
  plans: PlanEntry[];
  reminders: string[];
};

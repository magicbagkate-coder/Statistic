import type { OrderBatch } from '@/types/OrderBatch';

export type AgentState = {
  offset: number;
  batches: OrderBatch[];
  reminders: string[];
};

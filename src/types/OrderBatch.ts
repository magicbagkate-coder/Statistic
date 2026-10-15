import type { OrderPart } from '@/types/OrderPart';
import type { ShiftNumber } from '@/types/ShiftNumber';

export type OrderBatch = {
  date: string;
  shift: ShiftNumber;
  leader: string;
  parts: OrderPart[];
  lastMessageAt: number;
};

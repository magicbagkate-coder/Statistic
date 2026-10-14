import type { ShiftNumber } from '@/types/ShiftNumber';

export type OrderBatch = {
  date: string;
  shift: ShiftNumber;
  leader: string;
  orderIds: number[];
  lastMessageAt: number;
};

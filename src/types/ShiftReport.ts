import type { ReportRow } from '@/types/ReportRow';
import type { ShiftNumber } from '@/types/ShiftNumber';

export type ShiftReport = {
  date: string;
  shift: ShiftNumber;
  leader: string;
  leads: number;
  target: number;
  facebook: number;
  newBot: number;
  orders: number;
  conversion?: number;
  rows: ReportRow[];
  missingOrders: number[];
};

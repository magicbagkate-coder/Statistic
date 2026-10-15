import type { PlanValues } from '@/types/PlanValues';
import type { ReportRow } from '@/types/ReportRow';

export type DayReport = {
  date: string;
  leads: number;
  target: number;
  facebook: number;
  newBot: number;
  orders: number;
  conversion?: number;
  plan?: PlanValues;
  rows: ReportRow[];
  liveLeads: number;
  liveOrders: number;
  liveConversion?: number;
  serviceRequests: number;
};

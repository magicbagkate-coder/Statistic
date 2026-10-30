import type { PlanValues } from '@/types/PlanValues';
import type { ReportRow } from '@/types/ReportRow';

export type DayReport = {
  date: string;
  leads: number;
  target: number;
  facebook: number;
  newBot: number;
  awaitingPayment?: number;
  orders: number;
  conversion?: number;
  plan?: PlanValues;
  rows: ReportRow[];
  liveLeads: number;
  liveOrders: number;
  liveConversion?: number;
  serviceRequests: number;
  /** The TikTok orders written by the service manager; they are already in the TikTok source row (with the TikTok status leads). */
  tiktokOrders?: number;
  /** Exchange orders of the day, written by the service manager; absent in reports made before they were counted. */
  exchanges?: number;
};

import type { SourceCount } from '@/types/SourceCount';

export type LeadCounts = {
  leads: number;
  target: number;
  facebook: number;
  newBot: number;
  /** Leads in the "waiting for payment or data" status; absent in snapshots taken before it was counted. */
  awaitingPayment?: number;
  bySource: SourceCount[];
};

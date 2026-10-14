import type { SourceCount } from '@/types/SourceCount';

export type LeadCounts = {
  leads: number;
  target: number;
  facebook: number;
  newBot: number;
  bySource: SourceCount[];
};

import type { LeadCounts } from '@/types/LeadCounts';
import type { ServiceCounts } from '@/types/ServiceCounts';

export type DayCounts = {
  day: LeadCounts;
  service: ServiceCounts;
};

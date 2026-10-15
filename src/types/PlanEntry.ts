import type { PlanScope } from '@/types/PlanScope';

export type PlanEntry = {
  date: string;
  scope: PlanScope;
  orders?: number;
  conversion?: number;
};

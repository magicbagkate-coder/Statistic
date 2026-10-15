import type { PlanScope } from '@/types/PlanScope';
import type { PlanValues } from '@/types/PlanValues';

export type ParsedPlan = {
  date?: string;
  entries: { scope: PlanScope; values: PlanValues }[];
};

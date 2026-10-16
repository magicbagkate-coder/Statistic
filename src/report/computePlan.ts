import type { PlanValues } from '@/types/PlanValues';

/** The planned conversion, in percent of target leads. Change it here when the plan changes. */
export const PLAN_CONVERSION_PERCENT = 22;

const PERCENT = 100;

/** The plan for a shift or a day follows from its target leads: orders = target leads × planned conversion ÷ 100, rounded. */
export function computePlan(targetLeads: number): PlanValues {
  return { orders: Math.round((targetLeads * PLAN_CONVERSION_PERCENT) / PERCENT), conversion: PLAN_CONVERSION_PERCENT };
}

import type { PlanValues } from '@/types/PlanValues';
import type { ShiftReport } from '@/types/ShiftReport';

import { computePlan } from '@/report/computePlan';
import { conversionPercent } from '@/report/conversionPercent';

/**
 * The plan of a day is the sum of the plans of its two shifts; the planned conversion follows from that sum
 * and the target leads of the day. A shift report saved without a plan gives the plan from the day's target leads instead.
 */
export function computeDayPlan(request: { shiftReports: ShiftReport[]; target: number }): PlanValues {
  const { shiftReports, target } = request;
  const shiftPlans = shiftReports.map((report) => report.plan?.orders);
  if (shiftPlans.some((orders) => orders === undefined)) return computePlan(target);
  const orders = shiftPlans.reduce<number>((sum, value) => sum + (value ?? 0), 0);
  return { orders, conversion: conversionPercent(orders, target) };
}

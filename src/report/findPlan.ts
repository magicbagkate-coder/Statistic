import type { PlanEntry } from '@/types/PlanEntry';
import type { PlanScope } from '@/types/PlanScope';
import type { PlanValues } from '@/types/PlanValues';

const MONTH_LENGTH = 7;

/**
 * A shift plan belongs to its own date. A day plan stays in effect from the date it was written
 * until the end of that month, unless a later one replaces it.
 */
function appliesTo(item: PlanEntry, request: { date: string; scope: PlanScope }): boolean {
  if (item.scope !== request.scope) return false;
  if (request.scope !== 'day') return item.date === request.date;
  return item.date <= request.date && item.date.slice(0, MONTH_LENGTH) === request.date.slice(0, MONTH_LENGTH);
}

/** The plan in effect for a date and scope, or undefined when nobody wrote one. */
export function findPlan(plans: PlanEntry[], request: { date: string; scope: PlanScope }): PlanValues | undefined {
  const latest = plans
    .filter((item) => appliesTo(item, request))
    .sort((first, second) => second.date.localeCompare(first.date))[0];
  if (!latest) return undefined;
  return { orders: latest.orders, conversion: latest.conversion };
}

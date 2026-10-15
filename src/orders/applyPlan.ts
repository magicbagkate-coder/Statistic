import type { AgentState } from '@/types/AgentState';
import type { ParsedPlan } from '@/types/ParsedPlan';
import type { PlanEntry } from '@/types/PlanEntry';

import { findPlan } from '@/report/findPlan';

/**
 * Stores the plan for a date. Numbers not written again are kept from the plan that was in effect
 * (for a day plan, the month's standing plan), so a message may change only orders or only conversion.
 */
export function applyPlan(state: AgentState, request: { plan: ParsedPlan; date: string }): AgentState {
  const { plan, date } = request;
  const updated = plan.entries.map((entry): PlanEntry => {
    const previous = findPlan(state.plans, { date, scope: entry.scope });
    return { ...previous, ...entry.values, date, scope: entry.scope };
  });
  const untouched = state.plans.filter((item) => !(item.date === date && updated.some((entry) => entry.scope === item.scope)));
  return { ...state, plans: [...untouched, ...updated] };
}

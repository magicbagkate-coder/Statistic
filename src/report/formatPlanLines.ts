import type { PlanValues } from '@/types/PlanValues';

import { formatPercent } from '@/report/formatPercent';
import { pluralOrders } from '@/report/pluralOrders';
import { REPORT_TEXTS } from '@/report/reportTexts';

/** Below the plan: the shortfall. At or above the plan the plan is met, and an excess is added to that. */
function describeGap(request: { gap: number; amount: string }): string {
  const { gap, amount } = request;
  if (gap < 0) return `${REPORT_TEXTS.underPlan} ${amount}`;
  if (gap === 0) return REPORT_TEXTS.planMet;
  return `${REPORT_TEXTS.planMet}, ${REPORT_TEXTS.overPlan} ${amount}`;
}

function formatOrdersLine(plan: number, fact: number): string {
  const gap = fact - plan;
  const verdict = describeGap({ gap, amount: `${Math.abs(gap)} ${pluralOrders(Math.abs(gap))}` });
  return `${REPORT_TEXTS.planOrders}: ${plan} · ${REPORT_TEXTS.fact}: ${fact} (${verdict})`;
}

function formatConversionLine(plan: number, fact: number | undefined): string {
  if (fact === undefined) return `${REPORT_TEXTS.planConversion}: ${formatPercent(plan)} · ${REPORT_TEXTS.fact}: ${REPORT_TEXTS.noValue} (${REPORT_TEXTS.noValue})`;
  const gap = Math.round((fact - plan) * 10) / 10;
  const verdict = describeGap({ gap, amount: `${Math.abs(gap).toFixed(1).replace('.', ',')} ${REPORT_TEXTS.pointsShort}` });
  return `${REPORT_TEXTS.planConversion}: ${formatPercent(plan)} · ${REPORT_TEXTS.fact}: ${formatPercent(fact)} (${verdict})`;
}

/** Plan against fact lines for orders and conversion; only the parts that have a plan appear. */
export function formatPlanLines(request: { plan?: PlanValues; orders: number; conversion?: number }): string[] {
  const { plan, orders, conversion } = request;
  const lines: string[] = [];
  if (plan?.orders !== undefined) lines.push(formatOrdersLine(plan.orders, orders));
  if (plan?.conversion !== undefined) lines.push(formatConversionLine(plan.conversion, conversion));
  return lines;
}

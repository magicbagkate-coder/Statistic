import type { PlanValues } from '@/types/PlanValues';

import { formatPercent } from '@/report/formatPercent';
import { pluralOrders } from '@/report/pluralOrders';
import { REPORT_TEXTS } from '@/report/reportTexts';

function formatOrdersLine(plan: number, fact: number): string {
  const gap = fact - plan;
  const verdict = gap === 0 ? REPORT_TEXTS.planMet : `${gap < 0 ? REPORT_TEXTS.underPlan : REPORT_TEXTS.overPlan} ${Math.abs(gap)} ${pluralOrders(Math.abs(gap))}`;
  return `${REPORT_TEXTS.planOrders}: ${plan} · ${REPORT_TEXTS.fact}: ${fact} (${verdict})`;
}

function formatGap(plan: number, fact: number | undefined): string {
  if (fact === undefined) return REPORT_TEXTS.noValue;
  const gap = Math.round((fact - plan) * 10) / 10;
  if (gap === 0) return REPORT_TEXTS.planMet;
  return `${gap < 0 ? REPORT_TEXTS.underPlan : REPORT_TEXTS.overPlan} ${Math.abs(gap).toFixed(1).replace('.', ',')} ${REPORT_TEXTS.pointsShort}`;
}

function formatConversionLine(plan: number, fact: number | undefined): string {
  return `${REPORT_TEXTS.planConversion}: ${formatPercent(plan)} · ${REPORT_TEXTS.fact}: ${formatPercent(fact)} (${formatGap(plan, fact)})`;
}

/** Plan against fact lines for orders and conversion, with the shortfall or excess in brackets; only parts that have a plan appear. */
export function formatPlanLines(request: { plan?: PlanValues; orders: number; conversion?: number }): string[] {
  const { plan, orders, conversion } = request;
  const lines: string[] = [];
  if (plan?.orders !== undefined) lines.push(formatOrdersLine(plan.orders, orders));
  if (plan?.conversion !== undefined) lines.push(formatConversionLine(plan.conversion, conversion));
  return lines;
}

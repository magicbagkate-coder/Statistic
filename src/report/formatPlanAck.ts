import type { ParsedPlan } from '@/types/ParsedPlan';
import type { PlanScope } from '@/types/PlanScope';
import type { PlanValues } from '@/types/PlanValues';

import { formatDate } from '@/report/formatReport';
import { formatPercent } from '@/report/formatPercent';
import { REPORT_TEXTS } from '@/report/reportTexts';

const SCOPE_TEXTS: ReadonlyMap<PlanScope, string> = new Map([
  ['shift1', REPORT_TEXTS.scopeShift1],
  ['shift2', REPORT_TEXTS.scopeShift2],
  ['day', REPORT_TEXTS.scopeDay],
]);

function formatValues(values: PlanValues): string {
  const parts: string[] = [];
  if (values.orders !== undefined) parts.push(`заказы ${values.orders}`);
  if (values.conversion !== undefined) parts.push(`конверсия ${formatPercent(values.conversion)}`);
  return parts.join(', ');
}

/** The confirmation the bot writes in the group after reading a plan, so a misread number is seen at once. */
export function formatPlanAck(request: { plan: ParsedPlan; date: string }): string {
  const lines = request.plan.entries.map((entry) => `${SCOPE_TEXTS.get(entry.scope)}: ${formatValues(entry.values)}`);
  return [`${REPORT_TEXTS.planAccepted} · ${formatDate(request.date)}`, ...lines].join('\n');
}

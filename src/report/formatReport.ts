import type { ShiftReport } from '@/types/ShiftReport';

import { formatPercent } from '@/report/formatPercent';
import { formatPlanLines } from '@/report/formatPlanLines';
import { formatSourceRow } from '@/report/formatSourceRow';
import { REPORT_TEXTS } from '@/report/reportTexts';

/** Turns YYYY-MM-DD into DD.MM.YYYY. */
export function formatDate(date: string): string {
  return date.split('-').reverse().join('.');
}

function formatTitle(report: ShiftReport): string {
  const parts = [`${REPORT_TEXTS.shift} ${report.shift} · ${formatDate(report.date)}`];
  if (report.leader) parts.push(`${REPORT_TEXTS.leader} ${report.leader}`);
  return parts.join(' · ');
}

/** Builds the Telegram text of a shift report. */
export function formatReport(report: ShiftReport): string {
  const lines = [
    formatTitle(report),
    `${REPORT_TEXTS.leads}: ${report.leads} · ${REPORT_TEXTS.target}: ${report.target}`,
    `${REPORT_TEXTS.facebook}: ${report.facebook} · ${REPORT_TEXTS.newBot}: ${report.newBot}`,
    `${REPORT_TEXTS.orders}: ${report.orders} · ${REPORT_TEXTS.conversion}: ${formatPercent(report.conversion)}`,
    ...formatPlanLines({ plan: report.plan, orders: report.orders, conversion: report.conversion }),
    '',
    REPORT_TEXTS.bySource,
    ...report.rows.map(formatSourceRow),
  ];
  if (report.missingOrders.length > 0) lines.push('', `${REPORT_TEXTS.missingOrders}: ${report.missingOrders.join(', ')}`);
  return lines.join('\n');
}

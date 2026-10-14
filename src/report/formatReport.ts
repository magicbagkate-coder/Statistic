import type { ReportRow } from '@/types/ReportRow';
import type { ShiftReport } from '@/types/ShiftReport';

import { REPORT_TEXTS } from '@/report/reportTexts';

/** Turns YYYY-MM-DD into DD.MM.YYYY. */
export function formatDate(date: string): string {
  return date.split('-').reverse().join('.');
}

function formatPercent(value: number | undefined): string {
  if (value === undefined) return REPORT_TEXTS.noValue;
  return `${value.toFixed(1).replace('.', ',')}%`;
}

function formatRow(row: ReportRow): string {
  return `${row.source}: ${row.leads} / ${row.target} / ${row.orders} / ${formatPercent(row.conversion)}`;
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
    '',
    REPORT_TEXTS.bySource,
    ...report.rows.map(formatRow),
  ];
  if (report.missingOrders.length > 0) lines.push('', `${REPORT_TEXTS.missingOrders}: ${report.missingOrders.join(', ')}`);
  return lines.join('\n');
}

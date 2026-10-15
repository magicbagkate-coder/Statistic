import type { DayReport } from '@/types/DayReport';

import { formatPercent } from '@/report/formatPercent';
import { formatPlanLines } from '@/report/formatPlanLines';
import { formatDate } from '@/report/formatReport';
import { formatSourceRow } from '@/report/formatSourceRow';
import { REPORT_TEXTS } from '@/report/reportTexts';

/** Builds the Telegram text of the whole-day report. */
export function formatDayReport(report: DayReport): string {
  return [
    `${REPORT_TEXTS.dayTitle} · ${formatDate(report.date)}`,
    `${REPORT_TEXTS.leads}: ${report.leads} · ${REPORT_TEXTS.target}: ${report.target}`,
    `${REPORT_TEXTS.facebook}: ${report.facebook} · ${REPORT_TEXTS.newBot}: ${report.newBot}`,
    `${REPORT_TEXTS.orders}: ${report.orders} · ${REPORT_TEXTS.conversion}: ${formatPercent(report.conversion)}`,
    ...formatPlanLines({ plan: report.plan, orders: report.orders, conversion: report.conversion }),
    '',
    REPORT_TEXTS.bySource,
    ...report.rows.map(formatSourceRow),
    '',
    REPORT_TEXTS.dayOwner,
    `${REPORT_TEXTS.liveStreams}: ${REPORT_TEXTS.liveLeads} ${report.liveLeads} · ${REPORT_TEXTS.liveOrders} ${report.liveOrders} · ${REPORT_TEXTS.conversion} ${formatPercent(report.liveConversion)}`,
    `${REPORT_TEXTS.serviceRequests}: ${report.serviceRequests} ${REPORT_TEXTS.serviceHint}`,
  ].join('\n');
}

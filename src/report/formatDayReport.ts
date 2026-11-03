import type { DayReport } from '@/types/DayReport';

import { conversionPercent } from '@/report/conversionPercent';
import { dayTotalOrders } from '@/report/dayTotalOrders';
import { formatAwaitingPayment } from '@/report/formatAwaitingPayment';
import { formatExchanges } from '@/report/formatExchanges';
import { formatPercent } from '@/report/formatPercent';
import { formatPlanLines } from '@/report/formatPlanLines';
import { formatDate } from '@/report/formatReport';
import { formatSourceRow } from '@/report/formatSourceRow';
import { REPORT_TEXTS } from '@/report/reportTexts';

/** Builds the Telegram text of the whole-day report; its orders are all the orders of the day, like the table's total. */
export function formatDayReport(report: DayReport): string {
  const orders = dayTotalOrders(report);
  const conversion = conversionPercent(orders, report.target);
  return [
    `${REPORT_TEXTS.dayTitle} · ${formatDate(report.date)}`,
    `${REPORT_TEXTS.leads}: ${report.leads} · ${REPORT_TEXTS.target}: ${report.target}`,
    `${REPORT_TEXTS.facebook}: ${report.facebook} · ${REPORT_TEXTS.newBot}: ${report.newBot}`,
    ...formatAwaitingPayment(report.awaitingPayment),
    `${REPORT_TEXTS.orders}: ${orders} · ${REPORT_TEXTS.conversion}: ${formatPercent(conversion)}`,
    ...formatPlanLines({ plan: report.plan, orders, conversion }),
    '',
    REPORT_TEXTS.bySource,
    ...report.rows.map(formatSourceRow),
    '',
    REPORT_TEXTS.dayOwner,
    `${REPORT_TEXTS.liveStreams}: ${REPORT_TEXTS.liveLeads} ${report.liveLeads} · ${REPORT_TEXTS.liveOrders} ${report.liveOrders} · ${REPORT_TEXTS.conversion} ${formatPercent(report.liveConversion)}`,
    ...formatExchanges(report.exchanges),
    `${REPORT_TEXTS.serviceRequests}: ${report.serviceRequests} ${REPORT_TEXTS.serviceHint}`,
  ].join('\n');
}

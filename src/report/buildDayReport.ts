import type { DayCounts } from '@/types/DayCounts';
import type { DayReport } from '@/types/DayReport';
import type { LiveOrders } from '@/types/LiveOrders';
import type { PlanValues } from '@/types/PlanValues';
import type { ShiftReport } from '@/types/ShiftReport';

import { buildSourceRows } from '@/report/buildSourceRows';
import { conversionPercent } from '@/report/conversionPercent';

function sumOrdersBySource(shiftReports: ShiftReport[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const row of shiftReports.flatMap((report) => report.rows)) totals.set(row.source, (totals.get(row.source) ?? 0) + row.orders);
  return totals;
}

/**
 * Whole-day report: leads counted over the whole day without choosing managers, orders = both shifts' orders added up,
 * plus the service manager's live stream block: live stream leads = chats still in the live stream status at the end
 * of the day + live stream orders, conversion = live stream orders / live stream leads,
 * service requests = returns + service requests; exchanges is the exchange count the service manager wrote for the day.
 */
export function buildDayReport(input: { entry: LiveOrders; counts: DayCounts; shiftReports: ShiftReport[]; plan?: PlanValues; exchanges?: number }): DayReport {
  const { entry, counts, shiftReports, plan, exchanges } = input;
  const { day, service } = counts;
  const orders = shiftReports.reduce((sum, report) => sum + report.orders, 0);
  const liveLeads = service.liveStream + entry.count;
  return {
    date: entry.date,
    leads: day.leads,
    target: day.target,
    facebook: day.facebook,
    newBot: day.newBot,
    awaitingPayment: day.awaitingPayment,
    orders,
    conversion: conversionPercent(orders, day.target),
    plan,
    rows: buildSourceRows(day, sumOrdersBySource(shiftReports)),
    liveLeads,
    liveOrders: entry.count,
    liveConversion: conversionPercent(entry.count, liveLeads),
    serviceRequests: service.returns + service.serviceRequests,
    exchanges,
  };
}

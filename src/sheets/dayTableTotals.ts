import type { DayReport } from '@/types/DayReport';

/** The closing totals of the "День" row: the live stream, TikTok and exchange orders are added to the shifts' orders. */
export function dayTableTotals(report: DayReport): { leads: number; target: number; orders: number } {
  return { leads: report.leads, target: report.target, orders: report.orders + report.liveOrders + (report.tiktokOrders ?? 0) + (report.exchanges ?? 0) };
}

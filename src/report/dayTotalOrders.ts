import type { DayReport } from '@/types/DayReport';

/** All the orders of the day: the shifts' orders plus the live stream, TikTok and exchange orders the service manager wrote. */
export function dayTotalOrders(report: DayReport): number {
  return report.orders + report.liveOrders + (report.tiktokOrders ?? 0) + (report.exchanges ?? 0);
}

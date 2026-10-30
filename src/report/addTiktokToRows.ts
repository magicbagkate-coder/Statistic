import type { ReportRow } from '@/types/ReportRow';

import { TIKTOK_SOURCE } from '@/leads/leadSources';
import { conversionPercent } from '@/report/conversionPercent';

/**
 * Adds the TikTok status to the TikTok source row of the day: its leads (all of them target) and the orders written for it.
 * Nothing changes when there is nothing to add; the rows stay ordered by leads.
 */
export function addTiktokToRows(rows: ReportRow[], extra: { leads: number; orders: number }): ReportRow[] {
  if (extra.leads === 0 && extra.orders === 0) return rows;
  const own = rows.find((row) => row.source === TIKTOK_SOURCE) ?? { source: TIKTOK_SOURCE, leads: 0, target: 0, orders: 0 };
  const orders = own.orders + extra.orders;
  const target = own.target + extra.leads;
  const updated = { ...own, leads: own.leads + extra.leads, target, orders, conversion: conversionPercent(orders, target) };
  return [...rows.filter((row) => row !== own), updated].sort((first, second) => second.leads - first.leads);
}

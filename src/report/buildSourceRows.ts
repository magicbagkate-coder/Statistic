import type { LeadCounts } from '@/types/LeadCounts';
import type { ReportRow } from '@/types/ReportRow';
import type { SourceCount } from '@/types/SourceCount';

import { REPORT_SOURCES } from '@/leads/leadSources';
import { conversionPercent } from '@/report/conversionPercent';

/** No orders is a conversion of zero, also when there are no target leads to divide by. */
function rowConversion(orders: number, target: number): number | undefined {
  return orders === 0 ? 0 : conversionPercent(orders, target);
}

function makeRow(source: string, lead: SourceCount | undefined, orders: number): ReportRow {
  const target = lead?.target ?? 0;
  return { source, leads: lead?.leads ?? 0, target, orders, conversion: rowConversion(orders, target) };
}

/**
 * One row per source: leads, target leads, orders and conversion, largest source first. The known sources are always listed,
 * with zeros when nothing came from them; any other source appears when it has leads or orders.
 */
export function buildSourceRows(leads: LeadCounts, ordersBySource: Map<string, number>): ReportRow[] {
  const leadRows = new Map(leads.bySource.map((row) => [row.source, row] as const));
  const sources = new Set([...REPORT_SOURCES, ...leadRows.keys(), ...ordersBySource.keys()]);
  return [...sources]
    .map((source) => makeRow(source, leadRows.get(source), ordersBySource.get(source) ?? 0))
    .sort((first, second) => second.leads - first.leads);
}

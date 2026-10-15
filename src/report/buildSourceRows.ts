import type { LeadCounts } from '@/types/LeadCounts';
import type { ReportRow } from '@/types/ReportRow';
import type { SourceCount } from '@/types/SourceCount';

import { conversionPercent } from '@/report/conversionPercent';

function makeRow(source: string, lead: SourceCount | undefined, orders: number): ReportRow {
  const target = lead?.target ?? 0;
  return { source, leads: lead?.leads ?? 0, target, orders, conversion: conversionPercent(orders, target) };
}

/** One row per source (from leads or orders): leads, target leads, orders and conversion, largest source first. */
export function buildSourceRows(leads: LeadCounts, ordersBySource: Map<string, number>): ReportRow[] {
  const leadRows = new Map(leads.bySource.map((row) => [row.source, row] as const));
  const sources = new Set([...leadRows.keys(), ...ordersBySource.keys()]);
  return [...sources]
    .map((source) => makeRow(source, leadRows.get(source), ordersBySource.get(source) ?? 0))
    .sort((first, second) => second.leads - first.leads);
}

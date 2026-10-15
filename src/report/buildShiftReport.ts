import type { LeadCounts } from '@/types/LeadCounts';
import type { OrderBatch } from '@/types/OrderBatch';
import type { OrderInfo } from '@/types/OrderInfo';
import type { ReportRow } from '@/types/ReportRow';
import type { ShiftReport } from '@/types/ShiftReport';
import type { SourceCount } from '@/types/SourceCount';

import { batchOrderIds } from '@/orders/batchOrderIds';
import { findChannelLabel } from '@/orders/findChannelLabel';

const PERCENT = 100;

function conversionPercent(orders: number, target: number): number | undefined {
  if (target === 0) return undefined;
  return (orders / target) * PERCENT;
}

function countOrdersBySource(orders: OrderInfo[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const order of orders) {
    const source = findChannelLabel(order.channel);
    counts.set(source, (counts.get(source) ?? 0) + 1);
  }
  return counts;
}

function makeRow(source: string, lead: SourceCount | undefined, orders: number): ReportRow {
  const target = lead?.target ?? 0;
  return { source, leads: lead?.leads ?? 0, target, orders, conversion: conversionPercent(orders, target) };
}

function buildRows(leads: LeadCounts, ordersBySource: Map<string, number>): ReportRow[] {
  const leadRows = new Map(leads.bySource.map((row) => [row.source, row] as const));
  const sources = new Set([...leadRows.keys(), ...ordersBySource.keys()]);
  return [...sources]
    .map((source) => makeRow(source, leadRows.get(source), ordersBySource.get(source) ?? 0))
    .sort((first, second) => second.leads - first.leads);
}

/** Combines the lead snapshot with the orders of the batch: totals, per-source rows and conversion = orders / target leads. */
export function buildShiftReport(input: { batch: OrderBatch; leads: LeadCounts; orders: OrderInfo[] }): ShiftReport {
  const { batch, leads, orders } = input;
  const foundIds = new Set(orders.map((order) => order.id));
  return {
    date: batch.date,
    shift: batch.shift,
    leader: batch.leader,
    leads: leads.leads,
    target: leads.target,
    facebook: leads.facebook,
    newBot: leads.newBot,
    orders: orders.length,
    conversion: conversionPercent(orders.length, leads.target),
    rows: buildRows(leads, countOrdersBySource(orders)),
    missingOrders: batchOrderIds(batch).filter((id) => !foundIds.has(id)),
  };
}

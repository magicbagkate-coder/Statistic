import type { LeadCounts } from '@/types/LeadCounts';
import type { OrderBatch } from '@/types/OrderBatch';
import type { OrderInfo } from '@/types/OrderInfo';
import type { ShiftReport } from '@/types/ShiftReport';

import { batchOrderIds } from '@/orders/batchOrderIds';
import { findChannelLabel } from '@/orders/findChannelLabel';
import { buildSourceRows } from '@/report/buildSourceRows';
import { conversionPercent } from '@/report/conversionPercent';

function countOrdersBySource(orders: OrderInfo[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const order of orders) {
    const source = findChannelLabel(order.channel);
    counts.set(source, (counts.get(source) ?? 0) + 1);
  }
  return counts;
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
    rows: buildSourceRows(leads, countOrdersBySource(orders)),
    missingOrders: batchOrderIds(batch).filter((id) => !foundIds.has(id)),
  };
}

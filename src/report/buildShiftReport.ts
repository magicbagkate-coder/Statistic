import type { LeadCounts } from '@/types/LeadCounts';
import type { OrderBatch } from '@/types/OrderBatch';
import type { OrderInfo } from '@/types/OrderInfo';
import type { PlanValues } from '@/types/PlanValues';
import type { ShiftReport } from '@/types/ShiftReport';

import { batchOrderIds } from '@/orders/batchOrderIds';
import { batchUnnumbered } from '@/orders/batchUnnumbered';
import { findChannelLabel } from '@/orders/findChannelLabel';
import { buildSourceRows } from '@/report/buildSourceRows';
import { conversionPercent } from '@/report/conversionPercent';

function countOrdersBySource(sources: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const source of sources) counts.set(source, (counts.get(source) ?? 0) + 1);
  return counts;
}

/**
 * Combines the lead snapshot with the orders of the batch: totals, per-source rows and conversion = orders / target leads.
 * Orders listed without a number yet count as orders of the source the manager named.
 */
export function buildShiftReport(input: { batch: OrderBatch; leads: LeadCounts; orders: OrderInfo[]; plan?: PlanValues }): ShiftReport {
  const { batch, leads, orders, plan } = input;
  const foundIds = new Set(orders.map((order) => order.id));
  const sources = [...orders.map((order) => findChannelLabel(order.channel)), ...batchUnnumbered(batch)];
  return {
    date: batch.date,
    shift: batch.shift,
    leader: batch.leader,
    leads: leads.leads,
    target: leads.target,
    facebook: leads.facebook,
    newBot: leads.newBot,
    awaitingPayment: leads.awaitingPayment,
    orders: sources.length,
    conversion: conversionPercent(sources.length, leads.target),
    plan,
    rows: buildSourceRows(leads, countOrdersBySource(sources)),
    missingOrders: batchOrderIds(batch).filter((id) => !foundIds.has(id)),
  };
}

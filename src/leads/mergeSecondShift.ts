import type { LeadCounts } from '@/types/LeadCounts';

/**
 * Builds second shift counts from chats whose last message fell into 16:00-24:00:
 * general leads come from the managers of both shifts (morning chats may be continued in the evening),
 * while target leads, Facebook, new bot and the leads awaiting payment come from the second shift managers only.
 */
export function mergeSecondShift(parts: { direct: LeadCounts; bothShifts: LeadCounts }): LeadCounts {
  const { direct, bothShifts } = parts;
  const bothLeads = new Map(bothShifts.bySource.map((row) => [row.source, row.leads] as const));
  const directTarget = new Map(direct.bySource.map((row) => [row.source, row.target] as const));
  const sources = new Set([...bothLeads.keys(), ...directTarget.keys()]);
  const bySource = [...sources]
    .map((source) => ({ source, leads: bothLeads.get(source) ?? 0, target: directTarget.get(source) ?? 0 }))
    .sort((first, second) => second.leads - first.leads);
  return {
    leads: bothShifts.leads,
    target: direct.target,
    facebook: direct.facebook,
    newBot: direct.newBot,
    awaitingPayment: direct.awaitingPayment,
    bySource,
  };
}

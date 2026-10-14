import type { LeadCounts } from '@/types/LeadCounts';

function leadsBySource(counts: LeadCounts): Map<string, number> {
  return new Map(counts.bySource.map((row) => [row.source, row.leads] as const));
}

/**
 * Builds second shift counts: general leads are the whole-day count of both shifts minus the first shift snapshot;
 * target leads, Facebook and new bot come straight from the second shift managers.
 */
export function mergeSecondShift(parts: { direct: LeadCounts; bothShifts: LeadCounts; firstShift: LeadCounts }): LeadCounts {
  const { direct, bothShifts, firstShift } = parts;
  const bothLeads = leadsBySource(bothShifts);
  const firstLeads = leadsBySource(firstShift);
  const directTarget = new Map(direct.bySource.map((row) => [row.source, row.target] as const));
  const sources = new Set([...bothLeads.keys(), ...directTarget.keys()]);
  const bySource = [...sources]
    .map((source) => ({
      source,
      leads: (bothLeads.get(source) ?? 0) - (firstLeads.get(source) ?? 0),
      target: directTarget.get(source) ?? 0,
    }))
    .sort((first, second) => second.leads - first.leads);
  return {
    leads: bothShifts.leads - firstShift.leads,
    target: direct.target,
    facebook: direct.facebook,
    newBot: direct.newBot,
    bySource,
  };
}

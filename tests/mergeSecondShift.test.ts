import { describe, expect, it } from 'vitest';

import type { LeadCounts } from '@/types/LeadCounts';

import { mergeSecondShift } from '@/leads/mergeSecondShift';

const BOTH_SHIFTS: LeadCounts = {
  leads: 80,
  target: 30,
  facebook: 6,
  newBot: 20,
  bySource: [
    { source: 'Инста 1', leads: 15, target: 6 },
    { source: 'ФБ 1', leads: 60, target: 22 },
    { source: 'Вайбер', leads: 5, target: 2 },
  ],
};

const SECOND_DIRECT: LeadCounts = {
  leads: 70,
  target: 25,
  facebook: 4,
  newBot: 13,
  bySource: [
    { source: 'Инста 1', leads: 12, target: 5 },
    { source: 'ФБ 1', leads: 53, target: 18 },
    { source: 'Телеграм (Tiktok)', leads: 5, target: 2 },
  ],
};

describe('mergeSecondShift', () => {
  const merged = mergeSecondShift({ direct: SECOND_DIRECT, bothShifts: BOTH_SHIFTS });

  it('takes general leads from the managers of both shifts, in total and per source', () => {
    expect(merged.leads).toBe(80);
    expect(merged.bySource.find((row) => row.source === 'Инста 1')?.leads).toBe(15);
    expect(merged.bySource.find((row) => row.source === 'Вайбер')?.leads).toBe(5);
  });

  it('takes target, Facebook and new bot straight from the second shift managers', () => {
    expect(merged.target).toBe(25);
    expect(merged.facebook).toBe(4);
    expect(merged.newBot).toBe(13);
    expect(merged.bySource.find((row) => row.source === 'ФБ 1')?.target).toBe(18);
  });

  it('keeps a source that only appears in one of the two counts and sorts by general leads', () => {
    expect(merged.bySource.map((row) => row.source)).toEqual(['ФБ 1', 'Инста 1', 'Вайбер', 'Телеграм (Tiktok)']);
    expect(merged.bySource.find((row) => row.source === 'Телеграм (Tiktok)')).toEqual({ source: 'Телеграм (Tiktok)', leads: 0, target: 2 });
  });
});

import { describe, expect, it } from 'vitest';

import type { LeadCounts } from '@/types/LeadCounts';

import { mergeSecondShift } from '@/leads/mergeSecondShift';

const FIRST_SHIFT: LeadCounts = {
  leads: 100,
  target: 40,
  facebook: 5,
  newBot: 20,
  bySource: [
    { source: 'Инста 1', leads: 10, target: 4 },
    { source: 'ФБ 1', leads: 90, target: 36 },
  ],
};

const BOTH_SHIFTS: LeadCounts = {
  leads: 180,
  target: 70,
  facebook: 9,
  newBot: 33,
  bySource: [
    { source: 'Инста 1', leads: 25, target: 10 },
    { source: 'ФБ 1', leads: 150, target: 55 },
    { source: 'Вайбер', leads: 5, target: 2 },
  ],
};

const SECOND_DIRECT: LeadCounts = {
  leads: 90,
  target: 30,
  facebook: 4,
  newBot: 13,
  bySource: [
    { source: 'Инста 1', leads: 20, target: 8 },
    { source: 'ФБ 1', leads: 65, target: 20 },
    { source: 'Вайбер', leads: 5, target: 2 },
  ],
};

describe('mergeSecondShift', () => {
  const merged = mergeSecondShift({ direct: SECOND_DIRECT, bothShifts: BOTH_SHIFTS, firstShift: FIRST_SHIFT });

  it('subtracts the first shift from general leads, in total and per source', () => {
    expect(merged.leads).toBe(80);
    expect(merged.bySource.find((row) => row.source === 'Инста 1')?.leads).toBe(15);
    expect(merged.bySource.find((row) => row.source === 'Вайбер')?.leads).toBe(5);
  });

  it('takes target, Facebook and new bot straight from the second shift managers', () => {
    expect(merged.target).toBe(30);
    expect(merged.facebook).toBe(4);
    expect(merged.newBot).toBe(13);
    expect(merged.bySource.find((row) => row.source === 'ФБ 1')?.target).toBe(20);
  });

  it('sorts sources by general leads, largest first', () => {
    expect(merged.bySource.map((row) => row.source)).toEqual(['ФБ 1', 'Инста 1', 'Вайбер']);
  });
});

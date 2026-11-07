import { describe, expect, it, vi } from 'vitest';

import type { AppConfigService } from '@/config/AppConfigService';

import { classifyShiftCell } from '@/schedule/classifyShiftCell';
import { ScheduleService } from '@/schedule/ScheduleService';

vi.mock('@/schedule/fetchSheetRows', () => ({
  fetchSheetRows: vi.fn(({ tab }: { tab: string }) =>
    Promise.resolve(
      tab === 'managers'
        ? [['name', 'crm'], ['Эля младший', 'Эля Григорян'], ['Аня старшая', 'Ганна Кірієнко'], ['Аліна сервис', 'Аліна Хоніч']]
        : [['График роботи', '', '7'], [''], ['Эля младший', '', '8 - 24'], ['Аня старшая', '', '16 - 24'], ['Аліна сервис', '', '8 - 24']],
    ),
  ),
}));

describe('classifyShiftCell', () => {
  it('treats cells ending at 16 as the first shift, including a late start', () => {
    expect(classifyShiftCell('8 - 16')).toEqual([1]);
    expect(classifyShiftCell('9 - 16')).toEqual([1]);
  });

  it('treats cells ending at 24 and starting at 16 or later as the second shift', () => {
    expect(classifyShiftCell('16 - 24')).toEqual([2]);
    expect(classifyShiftCell('17 - 24')).toEqual([2]);
  });

  it('treats the whole day as both shifts', () => {
    expect(classifyShiftCell('8 - 24')).toEqual([1, 2]);
    expect(classifyShiftCell('9 - 24')).toEqual([1, 2]);
  });

  it('puts days off, vacations and empty cells in no shift', () => {
    expect(classifyShiftCell('вих')).toEqual([]);
    expect(classifyShiftCell('отпуск')).toEqual([]);
    expect(classifyShiftCell('')).toEqual([]);
  });
});

describe('ScheduleService.findShiftManagers', () => {
  const schedule = new ScheduleService({ config: { scheduleSpreadsheetId: 'id' } } as unknown as AppConfigService);

  it('counts a manager who works the whole day in both shifts, and keeps the service manager out of them', async () => {
    expect(await schedule.findShiftManagers({ date: '2026-11-07', shift: 1 })).toEqual(['Эля Григорян']);
    expect(await schedule.findShiftManagers({ date: '2026-11-07', shift: 2 })).toEqual(['Эля Григорян', 'Ганна Кірієнко']);
  });
});

import { describe, expect, it, vi } from 'vitest';

import type { Chat } from '@/types/Chat';
import type { ScheduleService } from '@/schedule/ScheduleService';
import type { ShiftManagers } from '@/types/ShiftManagers';
import type { SitniksService } from '@/sitniks/SitniksService';

import { LeadsService } from '@/leads/LeadsService';
import { ShiftLeadsService } from '@/leads/ShiftLeadsService';

function chat(manager: string | undefined, status = 'Новий'): Chat {
  return { status, initialSource: 'instagram', assignedManagerName: manager, lastMessageCreatedAt: '2026-11-10T10:00:00Z' };
}

const CHATS = [chat('Ольга'), chat('Марія'), chat('Ольга'), chat('Аліна Хоніч'), chat('Magicbag'), chat('Катерина Малюк'), chat(undefined)];

function build(lookup: () => Promise<ShiftManagers>): ShiftLeadsService {
  const schedule = { findShiftManagers: vi.fn(lookup) } as unknown as ScheduleService;
  return new ShiftLeadsService({} as SitniksService, schedule, new LeadsService());
}

describe('ShiftLeadsService.countShift without a matching schedule', () => {
  it('counts by the schedule when everything matches', async () => {
    const service = build(() => Promise.resolve({ names: ['Ольга'], problems: [] }));
    const counts = await service.countShift({ chats: CHATS, date: '2026-11-10', shift: 1 });
    expect(counts.leads).toBe(3);
    expect(counts.problems).toBeUndefined();
  });

  it('counts by the managers who have chats when a name is missing in the managers tab, and reports the problem', async () => {
    const service = build(() => Promise.resolve({ names: ['Ольга'], problems: ['нет во вкладке managers: Женя старший'] }));
    const counts = await service.countShift({ chats: CHATS, date: '2026-11-10', shift: 1 });
    expect(counts.leads).toBe(4);
    expect(counts.problems).toEqual(['нет во вкладке managers: Женя старший']);
  });

  it('counts by the managers who have chats when the schedule cannot be read, in the second shift too', async () => {
    const service = build(() => Promise.reject(new Error('Google Sheet request failed with HTTP 500')));
    const counts = await service.countShift({ chats: CHATS, date: '2026-11-10', shift: 2 });
    expect(counts.leads).toBe(4);
    expect(counts.problems).toEqual(['график недоступен: Google Sheet request failed with HTTP 500']);
  });
});

describe('LeadsService.findResponders', () => {
  it('lists each manager once and leaves out the service manager, ignored accounts and chats without a manager', () => {
    expect(new LeadsService().findResponders(CHATS)).toEqual(['Ольга', 'Марія']);
  });
});

describe('ScheduleService.findShiftManagers with an unknown name', () => {
  it('reports the missing name as a problem instead of failing', async () => {
    vi.resetModules();
    vi.doMock('@/schedule/fetchSheetRows', () => ({
      fetchSheetRows: vi.fn(({ tab }: { tab: string }) =>
        Promise.resolve(tab === 'managers' ? [['name', 'crm'], ['Эля младший', 'Эля Григорян']] : [['График роботи', '', '7'], [''], ['Эля младший', '', '8 - 16'], ['Новая', '', '8 - 16']]),
      ),
    }));
    const { ScheduleService: Fresh } = await import('@/schedule/ScheduleService');
    const schedule = new Fresh({ config: { scheduleSpreadsheetId: 'id' } } as never);
    expect(await schedule.findShiftManagers({ date: '2026-11-07', shift: 1 })).toEqual({
      names: ['Эля Григорян'],
      problems: ['нет во вкладке managers: Новая'],
    });
    vi.doUnmock('@/schedule/fetchSheetRows');
  });
});

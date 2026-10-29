import { describe, expect, it } from 'vitest';

import type { Chat } from '@/types/Chat';
import type { DayReport } from '@/types/DayReport';
import type { ShiftReport } from '@/types/ShiftReport';

import { LeadsService } from '@/leads/LeadsService';
import { formatDayReport } from '@/report/formatDayReport';
import { formatReport } from '@/report/formatReport';

function chat(status: string, manager?: string): Chat {
  return { status, initialSource: 'instagram', assignedManagerName: manager, lastMessageCreatedAt: '2026-10-29T10:00:00.000Z' };
}

const CHATS = [
  chat('Очікуємо оплату або дані', 'Оля'),
  chat('Очікуємо оплату або дані'),
  chat('Очікуємо оплату або дані', 'Другая'),
  chat('Новий', 'Оля'),
  chat('Завершено', 'Оля'),
];

describe('leads awaiting payment', () => {
  const leads = new LeadsService();

  it('are counted as a separate metric and stay inside the target leads', () => {
    const counts = leads.countLeads(CHATS);
    expect(counts.awaitingPayment).toBe(3);
    expect(counts.target).toBe(4);
    expect(counts.leads).toBe(4);
  });

  it('follow the same managers as the other counts of the shift', () => {
    expect(leads.countLeads(CHATS, ['Оля']).awaitingPayment).toBe(2);
  });
});

describe('the awaiting payment line', () => {
  const SHIFT: ShiftReport = { date: '2026-10-29', shift: 1, leader: 'Оля', leads: 50, target: 20, facebook: 3, newBot: 4, awaitingPayment: 7, orders: 5, rows: [], missingOrders: [] };
  const DAY = { date: '2026-10-29', leads: 90, target: 40, facebook: 3, newBot: 4, awaitingPayment: 11, orders: 9, rows: [], liveLeads: 0, liveOrders: 0, serviceRequests: 0 } as DayReport;

  it('comes right after the Facebook and new bot line in the shift and in the day report', () => {
    for (const text of [formatReport(SHIFT), formatDayReport(DAY)]) {
      const lines = text.split('\n');
      const index = lines.findIndex((line) => line.startsWith('«Фейсбук»'));
      expect(lines[index + 1]).toMatch(/^Отправленные реквизиты, но не оплачены: \d+$/);
    }
    expect(formatReport(SHIFT)).toContain('Отправленные реквизиты, но не оплачены: 7');
    expect(formatDayReport(DAY)).toContain('Отправленные реквизиты, но не оплачены: 11');
  });

  it('is left out when the snapshot was taken before the metric existed', () => {
    expect(formatReport({ ...SHIFT, awaitingPayment: undefined })).not.toContain('реквизиты');
  });
});

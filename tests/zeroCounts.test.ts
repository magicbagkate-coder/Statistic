import { describe, expect, it, vi } from 'vitest';

import type { SitniksService } from '@/sitniks/SitniksService';
import type { SnapshotStore } from '@/snapshots/SnapshotStore';
import type { ReportStore } from '@/storage/ReportStore';
import type { AgentState } from '@/types/AgentState';
import type { DayCounts } from '@/types/DayCounts';
import type { ShiftReport } from '@/types/ShiftReport';

import { forgetMessageCounts } from '@/orders/forgetMessageCounts';
import { parseExchangeOrders } from '@/orders/parseExchangeOrders';
import { parseLiveOrders } from '@/orders/parseLiveOrders';
import { ReportService } from '@/report/ReportService';

const COUNTS: DayCounts = { day: { leads: 100, target: 50, facebook: 0, newBot: 0, bySource: [] }, service: { liveStream: 4, returns: 1, serviceRequests: 1 } };

function shift(orders: number): ShiftReport {
  return { date: '2026-10-30', shift: 1, leader: 'Оля', leads: 0, target: 0, facebook: 0, newBot: 0, orders, rows: [], missingOrders: [] };
}

describe('the live stream count without the word about orders', () => {
  const written = '30.10, Алина \n\nОбмен - 2 \n\n9094539\n9095839\n\n\nПрямой эфир - 2\n\n9104468\n9109973';

  it('is read from the number right after the words, as it is written by the service manager', () => {
    expect(parseLiveOrders(written, '2026')).toEqual({ count: 2, date: '2026-10-30' });
    expect(parseExchangeOrders(written, '2026')).toEqual({ count: 2, date: '2026-10-30' });
    expect(parseLiveOrders('Прямой эфир: 5', '2026')?.count).toBe(5);
  });

  it('does not take a time, a date or an order number for the count', () => {
    expect(parseLiveOrders('Прямой эфир в 16:00', '2026')).toBeUndefined();
    expect(parseLiveOrders('Прямой эфир 16:00', '2026')).toBeUndefined();
    expect(parseLiveOrders('Прямой эфир 30.10', '2026')).toBeUndefined();
    expect(parseLiveOrders('Прямой эфир\n9104468', '2026')).toBeUndefined();
  });
});

describe('forgetMessageCounts', () => {
  const entry = (messageId: number): { date: string; count: number; messageId: number; lastMessageAt: number } => ({ date: '2026-10-30', count: 2, messageId, lastMessageAt: 0 });
  const state: AgentState = { offset: 0, batches: [], liveOrders: [entry(79)], exchanges: [entry(79)], tiktok: [entry(79), entry(80)], reminders: [] };

  it('drops the counts of the edited message only, so a removed line removes its count', () => {
    const forgotten = forgetMessageCounts(state, 79);
    expect(forgotten).toMatchObject({ liveOrders: [], exchanges: [] });
    expect(forgotten.tiktok.map((item) => item.messageId)).toEqual([80]);
  });
});

describe('the day report when the service manager wrote nothing', () => {
  it('has zero exchanges and zero TikTok orders, like zero live stream orders', async () => {
    const snapshots = { loadDay: vi.fn(() => Promise.resolve(COUNTS)) } as unknown as SnapshotStore;
    const store = {
      load: vi.fn((_date: string, number: number) => Promise.resolve({ report: shift(number === 1 ? 20 : 15), text: '', messageId: 1, sentAt: '' })),
      existsDay: vi.fn(() => Promise.resolve(false)),
    } as unknown as ReportStore;
    const report = await new ReportService({} as SitniksService, snapshots, store).prepareDayTableReport('2026-10-30');
    expect(report).toMatchObject({ liveOrders: 0, exchanges: 0, tiktokOrders: 0 });
  });
});

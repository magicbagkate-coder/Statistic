import { describe, expect, it, vi } from 'vitest';

import type { SitniksService } from '@/sitniks/SitniksService';
import type { SnapshotStore } from '@/snapshots/SnapshotStore';
import type { ReportStore } from '@/storage/ReportStore';
import type { AgentState } from '@/types/AgentState';
import type { DayCounts } from '@/types/DayCounts';
import type { DayReport } from '@/types/DayReport';
import type { ShiftReport } from '@/types/ShiftReport';

import { applyExchangeOrders } from '@/orders/applyExchangeOrders';
import { dropStaleExchanges, EXCHANGES_KEEP_MS } from '@/orders/dropStaleExchanges';
import { parseExchangeOrders } from '@/orders/parseExchangeOrders';
import { buildDayReport } from '@/report/buildDayReport';
import { formatDayReport } from '@/report/formatDayReport';
import { ReportService } from '@/report/ReportService';

const EMPTY: AgentState = { offset: 0, batches: [], liveOrders: [], exchanges: [], reminders: [] };
const COUNTS: DayCounts = { day: { leads: 100, target: 50, facebook: 0, newBot: 0, bySource: [] }, service: { liveStream: 4, returns: 1, serviceRequests: 1 } };

function shift(orders: number): ShiftReport {
  return { date: '2026-10-18', shift: 1, leader: 'Оля', leads: 0, target: 0, facebook: 0, newBot: 0, orders, rows: [], missingOrders: [] };
}

describe('parseExchangeOrders', () => {
  it('reads the number of exchanges the way the live stream count is written', () => {
    expect(parseExchangeOrders('15.10, Алина, Обмены - 2 заказа', '2026')).toEqual({ count: 2, date: '2026-10-15' });
    expect(parseExchangeOrders('Обмены 3', '2026')).toEqual({ count: 3, date: undefined });
    expect(parseExchangeOrders('15.10 обмен - 1 заказ', '2026')?.count).toBe(1);
  });

  it('ignores the order numbers written in the same message', () => {
    expect(parseExchangeOrders('15.10, Алина, Обмены - 2 заказа\n8808297 (19689)\n8809128', '2026')).toEqual({ count: 2, date: '2026-10-15' });
    expect(parseExchangeOrders('15.10, Алина, Обмены\n8808297\n8809128', '2026')).toBeUndefined();
  });

  it('ignores other messages', () => {
    expect(parseExchangeOrders('15.10, смена 1, Оля\n8808297', '2026')).toBeUndefined();
    expect(parseExchangeOrders('15.10, Алина, Прямой эфир - 5 заказов', '2026')).toBeUndefined();
  });
});

describe('applyExchangeOrders', () => {
  it('keeps the latest count of a day and the counts of other days', () => {
    const first = applyExchangeOrders(EMPTY, { date: '2026-10-15', count: 2, messageId: 1, lastMessageAt: 1000 });
    const second = applyExchangeOrders(first, { date: '2026-10-15', count: 3, messageId: 1, lastMessageAt: 2000 });
    const other = applyExchangeOrders(second, { date: '2026-10-16', count: 1, messageId: 9, lastMessageAt: 3000 });
    expect(other.exchanges.map((entry) => [entry.date, entry.count])).toEqual([['2026-10-15', 3], ['2026-10-16', 1]]);
  });

  it('forgets a count after a week', () => {
    const entry = { date: '2026-10-15', count: 2, messageId: 1, lastMessageAt: 0 };
    expect(dropStaleExchanges([entry], EXCHANGES_KEEP_MS - 1)).toEqual([entry]);
    expect(dropStaleExchanges([entry], EXCHANGES_KEEP_MS)).toEqual([]);
  });
});

describe('the day report with exchanges', () => {
  const entry = { date: '2026-10-18', count: 5, messageId: 1, lastMessageAt: 0 };
  const report = buildDayReport({ entry, counts: COUNTS, shiftReports: [shift(20), shift(15)], exchanges: 3 });

  it('keeps the orders of the shifts and writes the exchanges on their own line below the live streams', () => {
    expect(report).toMatchObject({ orders: 35, exchanges: 3 });
    const lines = formatDayReport(report).split('\n');
    expect(lines[lines.findIndex((line) => line.startsWith('Прямые эфиры')) + 1]).toBe('Обмены: 3');
  });

  it('has no exchanges line for reports made before they were counted', () => {
    expect(formatDayReport({ ...report, exchanges: undefined })).not.toContain('Обмены');
  });
});

describe('updateDayExchanges', () => {
  function build(stored: DayReport | undefined): ReportService {
    const store = { loadDay: vi.fn(() => Promise.resolve(stored ? { report: stored, text: '', messageId: 1, sentAt: '' } : undefined)) } as unknown as ReportStore;
    return new ReportService({} as SitniksService, {} as SnapshotStore, store);
  }
  const sent = { date: '2026-10-18', orders: 35, exchanges: undefined } as DayReport;

  it('gives the sent day report back with the new count when it differs, so it can be sent and written again', async () => {
    expect(await build(sent).updateDayExchanges({ date: '2026-10-18', count: 2 })).toMatchObject({ orders: 35, exchanges: 2 });
    expect(await build({ ...sent, exchanges: 1 }).updateDayExchanges({ date: '2026-10-18', count: 2 })).toMatchObject({ exchanges: 2 });
  });

  it('does nothing without a sent day report or when the count is already in it', async () => {
    expect(await build(undefined).updateDayExchanges({ date: '2026-10-18', count: 2 })).toBeUndefined();
    expect(await build({ ...sent, exchanges: 2 }).updateDayExchanges({ date: '2026-10-18', count: 2 })).toBeUndefined();
    expect(await build(sent).updateDayExchanges({ date: '2026-10-18', count: 0 })).toBeUndefined();
  });
});

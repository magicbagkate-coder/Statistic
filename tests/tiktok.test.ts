import { describe, expect, it, vi } from 'vitest';

import type { SitniksService } from '@/sitniks/SitniksService';
import type { SnapshotStore } from '@/snapshots/SnapshotStore';
import type { ReportStore } from '@/storage/ReportStore';
import type { AgentState } from '@/types/AgentState';
import type { Chat } from '@/types/Chat';
import type { DayCounts } from '@/types/DayCounts';
import type { DayReport } from '@/types/DayReport';
import type { ReportRow } from '@/types/ReportRow';
import type { ShiftReport } from '@/types/ShiftReport';

import { LeadsService } from '@/leads/LeadsService';
import { applyTiktokOrders } from '@/orders/applyTiktokOrders';
import { parseExchangeOrders } from '@/orders/parseExchangeOrders';
import { parseLiveOrders } from '@/orders/parseLiveOrders';
import { parseTiktokOrders } from '@/orders/parseTiktokOrders';
import { buildDayReport } from '@/report/buildDayReport';
import { formatDayReport } from '@/report/formatDayReport';
import { ReportService } from '@/report/ReportService';

const EMPTY: AgentState = { offset: 0, batches: [], liveOrders: [], exchanges: [], tiktok: [], reminders: [] };
const COUNTS: DayCounts = { day: { leads: 100, target: 50, facebook: 0, newBot: 0, bySource: [] }, service: { liveStream: 4, returns: 1, serviceRequests: 1, tiktok: 6 } };

function shift(orders: number): ShiftReport {
  return { date: '2026-10-30', shift: 1, leader: 'Оля', leads: 0, target: 0, facebook: 0, newBot: 0, orders, rows: [], missingOrders: [] };
}

function chat(status: string, manager?: string): Chat {
  return { status, assignedManagerName: manager } as Chat;
}

describe('parseTiktokOrders', () => {
  it('reads the number of TikTok orders the way the live stream count is written', () => {
    expect(parseTiktokOrders('30.10, Алина, Тикток - 3 заказа', '2026')).toEqual({ count: 3, date: '2026-10-30' });
    expect(parseTiktokOrders('Тикток 2', '2026')).toEqual({ count: 2, date: undefined });
    expect(parseTiktokOrders('30.10 тик ток: 1 заказ', '2026')?.count).toBe(1);
    expect(parseTiktokOrders('Тикток - 0', '2026')?.count).toBe(0);
  });

  it('ignores order numbers and the TikTok source of an unnumbered order in a shift list', () => {
    expect(parseTiktokOrders('30.10, Алина, Тикток - 3 заказа\n9074378\n9078998', '2026')?.count).toBe(3);
    expect(parseTiktokOrders('30.10, смена 1, Оля\n9074378 Тикток\nнет номера заказа (Тикток)', '2026')).toBeUndefined();
    expect(parseTiktokOrders('30.10, смена 1, Оля\n9074378', '2026')).toBeUndefined();
  });
});

describe('a message with the live stream, TikTok and exchange counts together', () => {
  const inOrder = '30.10, Алина, Прямой эфир - 4 заказа\n9074378\n9078998\n\nТикток - 3 заказа\n9018270\n\nОбмен - 1 заказ\n9018271';
  const reversed = '30.10, Алина, Обмен - 1 заказ\n9018271\n\nТикток - 3 заказа\n9018270\n\nПрямой эфир - 4 заказа\n9074378';

  it('reads each count from its own line, in any order', () => {
    for (const text of [inOrder, reversed]) {
      expect(parseLiveOrders(text, '2026')?.count).toBe(4);
      expect(parseTiktokOrders(text, '2026')?.count).toBe(3);
      expect(parseExchangeOrders(text, '2026')?.count).toBe(1);
    }
  });

  it('does not take the TikTok or exchange count for the live stream one', () => {
    expect(parseLiveOrders('30.10, Алина, Тикток - 3 заказа', '2026')).toBeUndefined();
    expect(parseTiktokOrders('30.10, Алина, Прямой эфир - 4 заказа', '2026')).toBeUndefined();
  });
});

describe('applyTiktokOrders', () => {
  it('keeps the latest count of a day and the counts of other days', () => {
    const first = applyTiktokOrders(EMPTY, { date: '2026-10-30', count: 2, messageId: 1, lastMessageAt: 1000 });
    const second = applyTiktokOrders(first, { date: '2026-10-30', count: 3, messageId: 1, lastMessageAt: 2000 });
    const other = applyTiktokOrders(second, { date: '2026-10-31', count: 1, messageId: 9, lastMessageAt: 3000 });
    expect(other.tiktok.map((entry) => [entry.date, entry.count])).toEqual([['2026-10-30', 3], ['2026-10-31', 1]]);
  });
});

describe('the TikTok status in the lead counts', () => {
  const leads = new LeadsService();
  const chats = [chat('Тикток', 'Аліна Хоніч'), chat('Тикток', 'Оля'), chat('Тикток'), chat('Вибір товару', 'Оля')];

  it('counts the chats in the status of any manager for the day, on its own', () => {
    expect(leads.countServiceLeads(chats).tiktok).toBe(3);
  });

  it('does not count them as shift leads', () => {
    expect(leads.countLeads(chats)).toMatchObject({ leads: 1, target: 1 });
  });
});

describe('the day report with the TikTok status', () => {
  const entry = { date: '2026-10-30', count: 5, messageId: 1, lastMessageAt: 0 };
  const tiktokRow = (report: DayReport): ReportRow | undefined => report.rows.find((row) => row.source === 'Тикток');

  it('puts the chats still in the status plus its orders into the TikTok source row as target leads, with the orders', () => {
    const report = buildDayReport({ entry, counts: COUNTS, shiftReports: [shift(20), shift(15)], tiktok: 2 });
    expect(tiktokRow(report)).toEqual({ source: 'Тикток', leads: 8, target: 8, orders: 2, conversion: 25 });
    expect(formatDayReport(report)).toContain('Тикток: 8 / 8 / 2 / 25,0%');
  });

  it('adds them to what the shifts already have for the TikTok source and keeps the shift totals', () => {
    const shifts = [{ ...shift(20), rows: [{ source: 'Тикток', leads: 4, target: 2, orders: 1, conversion: 50 }] }, shift(15)];
    const report = buildDayReport({ entry, counts: { ...COUNTS, day: { ...COUNTS.day, bySource: [{ source: 'Тикток', leads: 4, target: 2 }] } }, shiftReports: shifts, tiktok: 2 });
    expect(tiktokRow(report)).toEqual({ source: 'Тикток', leads: 12, target: 10, orders: 3, conversion: 30 });
    expect(report).toMatchObject({ leads: 100, target: 50, orders: 35, tiktokOrders: 2 });
  });

  it('uses the chats of the status when no orders were written, and leaves the rows alone when there is nothing', () => {
    const quiet = buildDayReport({ entry, counts: COUNTS, shiftReports: [shift(20), shift(15)] });
    expect(tiktokRow(quiet)).toMatchObject({ leads: 6, target: 6, orders: 0, conversion: 0 });
    const old: DayCounts = { ...COUNTS, service: { liveStream: 4, returns: 1, serviceRequests: 1 } };
    expect(tiktokRow(buildDayReport({ entry, counts: old, shiftReports: [shift(20), shift(15)] }))).toBeUndefined();
  });
});

describe('updateDayTiktok', () => {
  function build(stored: DayReport | undefined): ReportService {
    const store = { loadDay: vi.fn(() => Promise.resolve(stored ? { report: stored, text: '', messageId: 1, sentAt: '' } : undefined)) } as unknown as ReportStore;
    return new ReportService({} as SitniksService, {} as SnapshotStore, store);
  }
  const sent = { date: '2026-10-30', tiktokOrders: 2, rows: [{ source: 'Тикток', leads: 8, target: 8, orders: 2, conversion: 25 }] } as DayReport;

  it('gives the sent day report back with the TikTok row moved to the new count when it differs', async () => {
    const report = await build(sent).updateDayTiktok({ date: '2026-10-30', count: 4 });
    expect(report).toMatchObject({ tiktokOrders: 4, rows: [{ source: 'Тикток', leads: 10, target: 10, orders: 4, conversion: 40 }] });
  });

  it('does nothing without a sent day report or when the count is already in it', async () => {
    expect(await build(undefined).updateDayTiktok({ date: '2026-10-30', count: 4 })).toBeUndefined();
    expect(await build(sent).updateDayTiktok({ date: '2026-10-30', count: 2 })).toBeUndefined();
  });
});

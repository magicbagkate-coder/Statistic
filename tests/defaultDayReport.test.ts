import { describe, expect, it, vi } from 'vitest';

import type { SitniksService } from '@/sitniks/SitniksService';
import type { SnapshotStore } from '@/snapshots/SnapshotStore';
import type { ReportStore } from '@/storage/ReportStore';
import type { DayCounts } from '@/types/DayCounts';
import type { ShiftReport } from '@/types/ShiftReport';

import { ReportService } from '@/report/ReportService';

const COUNTS: DayCounts = {
  day: { leads: 100, target: 50, facebook: 0, newBot: 0, bySource: [] },
  service: { liveStream: 4, returns: 1, serviceRequests: 1 },
};

function shift(orders: number): ShiftReport {
  return { date: '2026-10-18', shift: 1, leader: 'Оля', leads: 0, target: 0, facebook: 0, newBot: 0, orders, rows: [], missingOrders: [] };
}

function build(request: { existsDay: boolean }): ReportService {
  const snapshots = { loadDay: vi.fn(() => Promise.resolve(COUNTS)) } as unknown as SnapshotStore;
  const store = {
    load: vi.fn((_date: string, number: number) => Promise.resolve({ report: shift(number === 1 ? 20 : 15), text: '', messageId: 1, sentAt: '' })),
    existsDay: vi.fn(() => Promise.resolve(request.existsDay)),
  } as unknown as ReportStore;
  return new ReportService({} as SitniksService, snapshots, store);
}

const BEFORE_DEADLINE = Date.parse('2026-10-18T22:30:00Z');
const AFTER_DEADLINE = Date.parse('2026-10-18T23:30:00Z');

describe('prepareDefaultDayReport', () => {
  it('waits for the live stream message until 02:00 Kyiv time of the next day', async () => {
    expect(await build({ existsDay: false }).prepareDefaultDayReport({ date: '2026-10-18', now: BEFORE_DEADLINE })).toBeUndefined();
  });

  it('builds the day report with zero live stream orders after the deadline, with the plan', async () => {
    const report = await build({ existsDay: false }).prepareDefaultDayReport({ date: '2026-10-18', now: AFTER_DEADLINE });
    expect(report).toMatchObject({ orders: 35, liveOrders: 0, liveLeads: 4, liveConversion: 0, plan: { orders: 11, conversion: 22 } });
  });

  it('does nothing when the day report has already been sent', async () => {
    expect(await build({ existsDay: true }).prepareDefaultDayReport({ date: '2026-10-18', now: AFTER_DEADLINE })).toBeUndefined();
  });
});

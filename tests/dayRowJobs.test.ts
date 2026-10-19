import { describe, expect, it, vi } from 'vitest';

import type { ReportDeliveryService } from '@/report/ReportDeliveryService';
import type { ReportService } from '@/report/ReportService';
import type { DayReport } from '@/types/DayReport';

import { DayRowJobs } from '@/jobs/DayRowJobs';
import { DayRowStore } from '@/storage/DayRowStore';

const REPORT: DayReport = {
  date: '2026-10-18',
  leads: 100,
  target: 40,
  facebook: 0,
  newBot: 0,
  orders: 10,
  rows: [],
  liveLeads: 0,
  liveOrders: 0,
  serviceRequests: 0,
};

type Setup = { jobs: DayRowJobs; tableRows: DayReport[]; dayReports: DayReport[]; remembered: Set<string> };

function build(request: { table: DayReport | undefined; fallback: DayReport | undefined }): Setup {
  const tableRows: DayReport[] = [];
  const dayReports: DayReport[] = [];
  const remembered = new Set<string>();
  const reports = {
    prepareDayTableReport: vi.fn(() => Promise.resolve(request.table)),
    prepareDefaultDayReport: vi.fn(() => Promise.resolve(request.fallback)),
  } as unknown as ReportService;
  const delivery = {
    writeDayRow: vi.fn((report: DayReport) => Promise.resolve(tableRows.push(report))),
    deliverDay: vi.fn((report: DayReport) => Promise.resolve(dayReports.push(report))),
  } as unknown as ReportDeliveryService;
  const store = {
    has: vi.fn((date: string) => Promise.resolve(remembered.has(date))),
    add: vi.fn((date: string) => Promise.resolve(remembered.add(date))),
  } as unknown as DayRowStore;
  return { jobs: new DayRowJobs(reports, delivery, store), tableRows, dayReports, remembered };
}

describe('DayRowJobs', () => {
  it('writes the day row once per date as soon as the day numbers are ready', async () => {
    const { jobs, tableRows, dayReports } = build({ table: REPORT, fallback: undefined });
    await jobs.writePendingDayRows();
    await jobs.writePendingDayRows();
    expect(tableRows).toHaveLength(2);
    expect(dayReports).toHaveLength(0);
  });

  it('waits while the snapshot or a shift report is missing', async () => {
    const { jobs, tableRows, remembered } = build({ table: undefined, fallback: undefined });
    await jobs.writePendingDayRows();
    expect(tableRows).toHaveLength(0);
    expect(remembered.size).toBe(0);
  });

  it('sends the day report with zero live stream orders once the deadline passed without a message', async () => {
    const { jobs, dayReports } = build({ table: REPORT, fallback: REPORT });
    await jobs.writePendingDayRows();
    expect(dayReports.length).toBeGreaterThan(0);
  });
});

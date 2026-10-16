import { describe, expect, it, vi } from 'vitest';

import type { SheetsReportWriter } from '@/sheets/SheetsReportWriter';
import type { ReportStore } from '@/storage/ReportStore';
import type { TelegramService } from '@/telegram/TelegramService';
import type { ShiftReport } from '@/types/ShiftReport';

import { ReportDeliveryService } from '@/report/ReportDeliveryService';

const REPORT: ShiftReport = {
  date: '2026-10-16',
  shift: 1,
  leader: 'Оля',
  leads: 100,
  target: 40,
  facebook: 5,
  newBot: 20,
  orders: 10,
  rows: [],
  missingOrders: [],
};

function build(writeShift: () => Promise<void>): { service: ReportDeliveryService; sent: string[]; saved: number[] } {
  const sent: string[] = [];
  const saved: number[] = [];
  const telegram = {
    sendToReportChat: vi.fn((text: string) => {
      sent.push(text);
      return Promise.resolve(7);
    }),
  } as unknown as TelegramService;
  const store = { save: vi.fn(() => Promise.resolve(saved.push(1))) } as unknown as ReportStore;
  const sheet = { writeShift: vi.fn(writeShift) } as unknown as SheetsReportWriter;
  return { service: new ReportDeliveryService(telegram, store, sheet), sent, saved };
}

describe('ReportDeliveryService', () => {
  it('sends the report, keeps a copy and writes the table row', async () => {
    const { service, sent, saved } = build(() => Promise.resolve());
    await service.deliver(REPORT);
    expect(sent).toHaveLength(1);
    expect(sent[0]).toContain('Смена 1 · 16.10.2026');
    expect(saved).toHaveLength(1);
  });

  it('still delivers the report when the table write fails, and warns the reports group', async () => {
    const { service, sent, saved } = build(() => Promise.reject(new Error('no access')));
    await expect(service.deliver(REPORT)).resolves.toBeUndefined();
    expect(saved).toHaveLength(1);
    expect(sent).toHaveLength(2);
    expect(sent[1]).toContain('не удалось записать его в таблицу');
    expect(sent[1]).toContain('no access');
  });
});

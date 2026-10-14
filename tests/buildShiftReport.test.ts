import { describe, expect, it } from 'vitest';

import type { LeadCounts } from '@/types/LeadCounts';

import { findChannelLabel } from '@/orders/findChannelLabel';
import { buildShiftReport } from '@/report/buildShiftReport';
import { formatReport } from '@/report/formatReport';

const LEADS: LeadCounts = {
  leads: 373,
  target: 160,
  facebook: 51,
  newBot: 159,
  bySource: [
    { source: 'Инста 1', leads: 200, target: 90 },
    { source: 'ФБ 1', leads: 19, target: 0 },
  ],
};

const BATCH = { date: '2026-10-14', shift: 1 as const, leader: 'Наташа', orderIds: [1, 2, 3, 4], lastMessageAt: 0 };

const ORDERS = [
  { id: 1, channel: 'instagram 1 аккаунт' },
  { id: 2, channel: 'instagram 1 аккаунт' },
  { id: 3, channel: 'Вайбер' },
];

describe('findChannelLabel', () => {
  it('maps Sitniks channels to source names and keeps unknown ones', () => {
    expect(findChannelLabel('Инстаграм 2 аккаунт')).toBe('Инста 2');
    expect(findChannelLabel('телеграм (Tiktok)')).toBe('Телеграм (Tiktok)');
    expect(findChannelLabel('сайт')).toBe('сайт');
  });
});

describe('buildShiftReport', () => {
  const report = buildShiftReport({ batch: BATCH, leads: LEADS, orders: ORDERS });

  it('counts orders and conversion as orders divided by target leads', () => {
    expect(report.orders).toBe(3);
    expect(report.conversion).toBeCloseTo((3 / 160) * 100);
  });

  it('lists orders that Sitniks did not return', () => {
    expect(report.missingOrders).toEqual([4]);
  });

  it('builds a row per source, including a source with orders but no leads, and no conversion without target leads', () => {
    const instagram = report.rows.find((row) => row.source === 'Инста 1');
    expect(instagram).toMatchObject({ leads: 200, target: 90, orders: 2 });
    expect(instagram?.conversion).toBeCloseTo((2 / 90) * 100);
    expect(report.rows.find((row) => row.source === 'Вайбер')).toMatchObject({ leads: 0, target: 0, orders: 1, conversion: undefined });
  });
});

describe('formatReport', () => {
  it('writes a readable Telegram text', () => {
    const text = formatReport(buildShiftReport({ batch: BATCH, leads: LEADS, orders: ORDERS }));
    expect(text).toContain('Смена 1 · 14.10.2026 · руководитель Наташа');
    expect(text).toContain('Лиды: 373 · целевые: 160');
    expect(text).toContain('Заказы: 3 · конверсия: 1,9%');
    expect(text).toContain('Инста 1: 200 / 90 / 2 / 2,2%');
    expect(text).toContain('Не найдены в Sitniks: 4');
  });
});

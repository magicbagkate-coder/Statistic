import { describe, expect, it } from 'vitest';

import type { DayCounts } from '@/types/DayCounts';
import type { ShiftReport } from '@/types/ShiftReport';

import { buildDayReport } from '@/report/buildDayReport';
import { formatDayReport } from '@/report/formatDayReport';

const COUNTS: DayCounts = {
  day: {
    leads: 700,
    target: 200,
    facebook: 90,
    newBot: 300,
    bySource: [
      { source: 'Инста 1', leads: 400, target: 120 },
      { source: 'ФБ 1', leads: 60, target: 20 },
      { source: 'Тикток', leads: 4, target: 0 },
    ],
  },
  service: { liveStream: 8, returns: 3, serviceRequests: 1 },
};

function shiftReport(shift: 1 | 2, orders: number, rows: { source: string; orders: number }[]): ShiftReport {
  return {
    date: '2026-10-15',
    shift,
    leader: 'Оля',
    leads: 0,
    target: 0,
    facebook: 0,
    newBot: 0,
    orders,
    rows: rows.map((row) => ({ ...row, leads: 0, target: 0 })),
    missingOrders: [],
  };
}

const SHIFTS = [
  shiftReport(1, 20, [
    { source: 'Инста 1', orders: 17 },
    { source: 'ФБ 1', orders: 3 },
  ]),
  shiftReport(2, 15, [
    { source: 'Инста 1', orders: 9 },
    { source: 'Телеграмм', orders: 6 },
  ]),
];

const ENTRY = { date: '2026-10-15', count: 6, messageId: 1, lastMessageAt: 0 };

describe('buildDayReport', () => {
  const report = buildDayReport({ entry: ENTRY, counts: COUNTS, shiftReports: SHIFTS });

  it('adds up the orders of both shifts and divides by the day target leads', () => {
    expect(report.orders).toBe(35);
    expect(report.conversion).toBeCloseTo((35 / 200) * 100);
  });

  it('adds up orders per source, keeps sources that only have orders, and has no conversion without target leads', () => {
    expect(report.rows.find((row) => row.source === 'Инста 1')).toMatchObject({ leads: 400, target: 120, orders: 26 });
    expect(report.rows.find((row) => row.source === 'Телеграмм')).toMatchObject({ leads: 0, target: 0, orders: 6, conversion: undefined });
    expect(report.rows.find((row) => row.source === 'Тикток')?.conversion).toBeUndefined();
  });

  it('computes the live stream block: conversion over live stream leads, service requests = returns + service', () => {
    expect(report.liveLeads).toBe(8);
    expect(report.liveOrders).toBe(6);
    expect(report.liveConversion).toBeCloseTo(75);
    expect(report.serviceRequests).toBe(4);
  });

  it('has no live stream conversion without live stream leads', () => {
    const none = buildDayReport({ entry: ENTRY, counts: { ...COUNTS, service: { ...COUNTS.service, liveStream: 0 } }, shiftReports: SHIFTS });
    expect(none.liveConversion).toBeUndefined();
  });
});

describe('formatDayReport', () => {
  it('writes the day totals, the sources and the live stream block', () => {
    const text = formatDayReport(buildDayReport({ entry: ENTRY, counts: COUNTS, shiftReports: SHIFTS }));
    expect(text).toContain('Итог дня · 15.10.2026');
    expect(text).toContain('Лиды: 700 · целевые: 200');
    expect(text).toContain('«Фейсбук»: 90 · «Новий БОТ»: 300');
    expect(text).toContain('Заказы: 35 · конверсия: 17,5%');
    expect(text).toContain('Инста 1: 400 / 120 / 26 / 21,7%');
    expect(text).toContain('Алина\nПрямые эфиры: лиды 8 · заказы 6 · конверсия 75,0%\nСервисные обращения: 4 (возвраты + сервисные)');
  });
});

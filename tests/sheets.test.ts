import { describe, expect, it } from 'vitest';

import type { DayReport } from '@/types/DayReport';
import type { ReportRow } from '@/types/ReportRow';

import { buildHeaderValues } from '@/sheets/buildHeaderValues';
import { buildRowValues } from '@/sheets/buildRowValues';
import { dayTableTotals } from '@/sheets/dayTableTotals';
import { sheetDateSerial } from '@/sheets/sheetDateSerial';
import { blockStarts, totalColumn } from '@/sheets/sheetLayout';

const ROWS: ReportRow[] = [
  { source: 'Инста 1', leads: 200, target: 80, orders: 20, conversion: 25 },
  { source: 'Тикток', leads: 4, target: 2, orders: 1 },
  { source: 'Телеграм (Tiktok)', leads: 6, target: 3, orders: 2 },
  { source: 'Вайбер', leads: 0, target: 0, orders: 1 },
  { source: 'сайт', leads: 0, target: 0, orders: 5 },
];

describe('sheetDateSerial', () => {
  it('gives the number Google Sheets uses for a date', () => {
    expect(sheetDateSerial('2026-10-15')).toBe(46310);
    expect(sheetDateSerial('2026-10-16')).toBe(46311);
  });
});

describe('dayTableTotals', () => {
  it('adds the live stream, TikTok and exchange orders to the shifts orders and keeps the leads as they are', () => {
    const report = { date: '2026-10-18', leads: 300, target: 120, orders: 29, liveOrders: 4, tiktokOrders: 3, exchanges: 2 } as DayReport;
    expect(dayTableTotals(report)).toEqual({ leads: 300, target: 120, orders: 38 });
    expect(dayTableTotals({ ...report, exchanges: undefined, tiktokOrders: undefined })).toEqual({ leads: 300, target: 120, orders: 33 });
  });
});

describe('buildHeaderValues', () => {
  const [titles, names] = buildHeaderValues();

  it('has two header rows as wide as the table, ending with the live stream leads and orders, the exchanges and the totals', () => {
    expect(titles).toHaveLength(totalColumn() + 8);
    expect(names).toHaveLength(totalColumn() + 8);
    expect(titles.slice(-8)).toEqual(['Прямой эфир (лиды)', 'Прямой эфир (заказы)', 'Обмены', 'Всего лидов (общих)', 'Всего лидов (целевых)', 'Всего продано', 'Конверсия общая', 'Конверсия целевая']);
  });

  it('puts each block title in the first cell of its block', () => {
    const starts = blockStarts();
    expect(titles[starts[0]]).toBe('Instagram 1 (основной)');
    expect(titles[starts[2]]).toBe('TikTok');
    expect(names.slice(starts[0], starts[0] + 5)).toEqual(['Общие', 'Целевые', 'Заказы', 'Конверсия общ.', 'Конверсия целевая']);
  });
});

describe('buildRowValues', () => {
  const cells = buildRowValues({ rows: ROWS, totals: { leads: 300, target: 120, orders: 29 }, live: { leads: 7, orders: 4 }, exchanges: 2 });
  const starts = blockStarts();
  const blockCells = (block: number): (string | number)[] => cells.slice(starts[block] - 2, starts[block] - 2 + 5);

  it('has one cell per column from the first block to the end, closing with the live stream leads and orders, the exchanges, all leads, target leads, orders and the two conversions', () => {
    expect(cells).toHaveLength(totalColumn() - 2 + 8);
    expect(cells.slice(-8)).toEqual([7, 4, 2, 300, 120, 29, 29 / 300, 29 / 120]);
  });

  it('writes leads, target leads, orders and the two conversions as fractions', () => {
    expect(blockCells(0)).toEqual([200, 80, 20, 0.1, 0.25]);
  });

  it('adds TikTok and Telegram TikTok together in the TikTok block', () => {
    expect(blockCells(2)).toEqual([10, 5, 3, 0.3, 0.6]);
  });

  it('leaves a conversion empty when orders have nothing to divide by, and keeps blocks without target leads at three columns', () => {
    const viber = cells.slice(starts[6] - 2, starts[6] - 2 + 3);
    expect(viber).toEqual([0, 1, '']);
  });

  it('writes zero for both conversions when there are no orders, even with no leads', () => {
    expect(blockCells(1)).toEqual([0, 0, 0, 0, 0]);
  });
});

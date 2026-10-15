import { describe, expect, it } from 'vitest';

import type { AgentState } from '@/types/AgentState';

import { applyPlan } from '@/orders/applyPlan';
import { parseOrderMessage } from '@/orders/parseOrderMessage';
import { parsePlanMessage } from '@/orders/parsePlanMessage';
import { findPlan } from '@/report/findPlan';
import { formatPlanAck } from '@/report/formatPlanAck';
import { formatPlanLines } from '@/report/formatPlanLines';
import { monthName } from '@/report/monthName';
import { pluralOrders } from '@/report/pluralOrders';

const EMPTY: AgentState = { offset: 0, batches: [], liveOrders: [], plans: [], reminders: [] };

describe('parsePlanMessage', () => {
  it('reads the way the owner writes a plan: date with a dash, shift, conversion and orders on one line', () => {
    expect(parsePlanMessage('15-10, смена 1, план по конверсии 22%, план по заказам 30', '2026')).toEqual({
      date: '2026-10-15',
      entries: [{ scope: 'shift1', values: { orders: 30, conversion: 22 } }],
    });
  });

  it('reads a plan written on several lines for both shifts and the day', () => {
    const text = 'План 16.10\nСмена 1: заказы 20, конверсия 20%\nСмена 2: заказы 25, конверсия 18,5%\nДень: заказы 45, конверсия 19%';
    expect(parsePlanMessage(text, '2026')).toEqual({
      date: '2026-10-16',
      entries: [
        { scope: 'shift1', values: { orders: 20, conversion: 20 } },
        { scope: 'shift2', values: { orders: 25, conversion: 18.5 } },
        { scope: 'day', values: { orders: 45, conversion: 19 } },
      ],
    });
  });

  it('treats numbers before any shift line as the day plan, and ignores messages that are not plans', () => {
    expect(parsePlanMessage('План 16.10 заказы 45 конверсия 19%', '2026')?.entries).toEqual([{ scope: 'day', values: { orders: 45, conversion: 19 } }]);
    expect(parsePlanMessage('16.10, смена 1, Оля\n8808297 (19689)', '2026')).toBeUndefined();
    expect(parsePlanMessage('план на завтра обсудим', '2026')).toBeUndefined();
  });

  it('does not take a decimal conversion for a date', () => {
    expect(parsePlanMessage('Смена 1: заказы 20, конверсия 20.5%', '2026')?.date).toBeUndefined();
  });
});

describe('dates written with a dash or a slash', () => {
  it('are read in captions too, and times are not mistaken for dates', () => {
    expect(parseOrderMessage('15-10, смена 2, Аня', '2026').caption?.date).toBe('2026-10-15');
    expect(parseOrderMessage('15/10 смена 1 Оля', '2026').caption?.date).toBe('2026-10-15');
    expect(parseOrderMessage('смена 1, до 16.30', '2026').caption).toBeUndefined();
  });
});

describe('applyPlan and findPlan', () => {
  const plan = { date: '2026-10-15', entries: [{ scope: 'shift1' as const, values: { orders: 30, conversion: 22 } }] };

  it('stores a plan and finds it by date and scope', () => {
    const state = applyPlan(EMPTY, { plan, date: '2026-10-15' });
    expect(findPlan(state.plans, { date: '2026-10-15', scope: 'shift1' })).toEqual({ orders: 30, conversion: 22 });
    expect(findPlan(state.plans, { date: '2026-10-15', scope: 'shift2' })).toBeUndefined();
  });

  it('lets a later message change only the numbers it contains', () => {
    const first = applyPlan(EMPTY, { plan, date: '2026-10-15' });
    const second = applyPlan(first, { plan: { entries: [{ scope: 'shift1', values: { orders: 35 } }] }, date: '2026-10-15' });
    expect(findPlan(second.plans, { date: '2026-10-15', scope: 'shift1' })).toEqual({ orders: 35, conversion: 22 });
    expect(second.plans).toHaveLength(1);
  });
});

describe('the day plan', () => {
  const standing: AgentState = { ...EMPTY, plans: [{ date: '2026-10-01', scope: 'day', orders: 30, conversion: 20 }] };

  it('stays in effect every day until the end of its month, and not in the next month', () => {
    expect(findPlan(standing.plans, { date: '2026-10-15', scope: 'day' })).toEqual({ orders: 30, conversion: 20 });
    expect(findPlan(standing.plans, { date: '2026-10-31', scope: 'day' })).toEqual({ orders: 30, conversion: 20 });
    expect(findPlan(standing.plans, { date: '2026-11-01', scope: 'day' })).toBeUndefined();
    expect(findPlan(standing.plans, { date: '2026-09-30', scope: 'day' })).toBeUndefined();
  });

  it('is replaced from the date of a new day plan, keeping the number that was not written again', () => {
    const changed = applyPlan(standing, { plan: { entries: [{ scope: 'day', values: { orders: 28 } }] }, date: '2026-10-20' });
    expect(findPlan(changed.plans, { date: '2026-10-19', scope: 'day' })).toEqual({ orders: 30, conversion: 20 });
    expect(findPlan(changed.plans, { date: '2026-10-20', scope: 'day' })).toEqual({ orders: 28, conversion: 20 });
    expect(findPlan(changed.plans, { date: '2026-10-25', scope: 'day' })).toEqual({ orders: 28, conversion: 20 });
  });

  it('does not carry a shift plan over to other days', () => {
    const shift: AgentState = { ...EMPTY, plans: [{ date: '2026-10-15', scope: 'shift1', orders: 10 }] };
    expect(findPlan(shift.plans, { date: '2026-10-16', scope: 'shift1' })).toBeUndefined();
  });
});

describe('monthName', () => {
  it('gives the Russian month name for the reminder', () => {
    expect(monthName(11)).toBe('ноябрь');
    expect(monthName(1)).toBe('январь');
  });
});

describe('formatPlanLines', () => {
  it('writes the shortfall of orders and of conversion in brackets', () => {
    expect(formatPlanLines({ plan: { orders: 30, conversion: 22 }, orders: 20, conversion: 15 })).toEqual([
      'План по заказам: 30 · факт: 20 (недовыполнение 10 заказов)',
      'План по конверсии: 22,0% · факт: 15,0% (недовыполнение 7,0 п.п.)',
    ]);
  });

  it('writes an excess, a met plan and a missing fact', () => {
    expect(formatPlanLines({ plan: { orders: 20 }, orders: 25 })).toEqual(['План по заказам: 20 · факт: 25 (перевыполнение 5 заказов)']);
    expect(formatPlanLines({ plan: { orders: 20, conversion: 15 }, orders: 20, conversion: 15 })[1]).toContain('(план выполнен)');
    expect(formatPlanLines({ plan: { conversion: 15 }, orders: 0, conversion: undefined })[0]).toContain('факт: — (—)');
  });

  it('writes nothing without a plan', () => {
    expect(formatPlanLines({ orders: 20, conversion: 15 })).toEqual([]);
  });
});

describe('pluralOrders', () => {
  it('uses the right Russian form', () => {
    expect([1, 2, 5, 11, 12, 21, 22, 25, 100, 101].map(pluralOrders)).toEqual([
      'заказ',
      'заказа',
      'заказов',
      'заказов',
      'заказов',
      'заказ',
      'заказа',
      'заказов',
      'заказов',
      'заказ',
    ]);
  });
});

describe('formatPlanAck', () => {
  it('repeats the plan so a misread number is seen at once', () => {
    const text = formatPlanAck({ plan: { entries: [{ scope: 'shift1', values: { orders: 30, conversion: 22 } }] }, date: '2026-10-15' });
    expect(text).toBe('План принят · 15.10.2026\nСмена 1: заказы 30, конверсия 22,0%');
  });
});

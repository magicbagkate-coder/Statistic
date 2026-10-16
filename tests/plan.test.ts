import { describe, expect, it } from 'vitest';

import { dropStaleBatches, STALE_EMPTY_BATCH_MS } from '@/orders/dropStaleBatches';
import { isChatter } from '@/orders/isChatter';
import { parseOrderMessage } from '@/orders/parseOrderMessage';
import { computePlan, PLAN_CONVERSION_PERCENT } from '@/report/computePlan';
import { formatPlanLines } from '@/report/formatPlanLines';
import { pluralOrders } from '@/report/pluralOrders';

describe('computePlan', () => {
  it('plans 22% conversion and orders = target leads × 22 ÷ 100', () => {
    expect(PLAN_CONVERSION_PERCENT).toBe(22);
    expect(computePlan(200)).toEqual({ orders: 44, conversion: 22 });
    expect(computePlan(160)).toEqual({ orders: 35, conversion: 22 });
  });

  it('rounds to a whole number of orders and has an empty plan without target leads', () => {
    expect(computePlan(133)).toEqual({ orders: 29, conversion: 22 });
    expect(computePlan(0)).toEqual({ orders: 0, conversion: 22 });
  });
});

describe('formatPlanLines', () => {
  it('writes the shortfall of orders and of conversion in brackets', () => {
    expect(formatPlanLines({ plan: { orders: 44, conversion: 22 }, orders: 34, conversion: 17 })).toEqual([
      'План по заказам: 44 · факт: 34 (недовыполнение 10 заказов)',
      'План по конверсии: 22,0% · факт: 17,0% (недовыполнение 5,0%)',
    ]);
  });

  it('counts an excess as a met plan and adds the excess', () => {
    expect(formatPlanLines({ plan: { orders: 20 }, orders: 25 })).toEqual(['План по заказам: 20 · факт: 25 (план выполнен, перевыполнение 5 заказов)']);
    expect(formatPlanLines({ plan: { conversion: 15 }, orders: 20, conversion: 17 })[0]).toBe(
      'План по конверсии: 15,0% · факт: 17,0% (план выполнен, перевыполнение 2,0%)',
    );
  });

  it('writes a met plan and a missing fact', () => {
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

describe('chatter in the group', () => {
  it('is recognised and left out: plans and the managers progress updates never open a shift batch', () => {
    expect(isChatter('15-10, смена 1, план по конверсии 22%, план по заказам 30')).toBe(true);
    expect(isChatter('1 смена \n15.10 на 12.00\n79\n21.5%\n18 заказов')).toBe(true);
    expect(isChatter('15.10, смена 1, Оля')).toBe(false);
    expect(isChatter('Смена 1\n16.10\nНаташа\n\n8848198')).toBe(false);
  });

  it('forgets a caption without order numbers after twelve hours, but keeps one that has orders', () => {
    const empty = { date: '2026-10-15', shift: 1 as const, leader: 'Оля', parts: [{ messageId: 1, orderIds: [] }], lastMessageAt: 0 };
    const full = { ...empty, parts: [{ messageId: 2, orderIds: [8800456] }] };
    expect(dropStaleBatches([empty, full], STALE_EMPTY_BATCH_MS - 1)).toEqual([empty, full]);
    expect(dropStaleBatches([empty, full], STALE_EMPTY_BATCH_MS)).toEqual([full]);
  });
});

describe('dates written with a dash or a slash', () => {
  it('are read in captions, and times are not mistaken for dates', () => {
    expect(parseOrderMessage('15-10, смена 2, Аня', '2026').caption?.date).toBe('2026-10-15');
    expect(parseOrderMessage('15/10 смена 1 Оля', '2026').caption?.date).toBe('2026-10-15');
    expect(parseOrderMessage('смена 1, до 16.30', '2026').caption).toBeUndefined();
  });
});

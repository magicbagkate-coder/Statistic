import { describe, expect, it } from 'vitest';

import type { AgentState } from '@/types/AgentState';

import { applyLiveOrders } from '@/orders/applyLiveOrders';
import { parseLiveOrders } from '@/orders/parseLiveOrders';
import { resolveLiveDate } from '@/orders/resolveLiveDate';

const EMPTY: AgentState = { offset: 0, batches: [], liveOrders: [], reminders: [] };

describe('parseLiveOrders', () => {
  it('reads the live stream order count from the way Alina writes it', () => {
    expect(parseLiveOrders('заказы прямой эфир 7', '2026')).toEqual({ count: 7, date: undefined });
    expect(parseLiveOrders('Заказы прямой эфир: 12', '2026')?.count).toBe(12);
    expect(parseLiveOrders('прямой эфир заказы - 3', '2026')?.count).toBe(3);
  });

  it('does not take the date for the count and keeps the written date', () => {
    expect(parseLiveOrders('15.10 заказы прямой эфир 5', '2026')).toEqual({ count: 5, date: '2026-10-15' });
  });

  it('ignores other messages, including shift captions and order lists', () => {
    expect(parseLiveOrders('15.10, смена 1, Оля', '2026')).toBeUndefined();
    expect(parseLiveOrders('8808297 (19689)', '2026')).toBeUndefined();
    expect(parseLiveOrders('сегодня был прямой эфир', '2026')).toBeUndefined();
  });
});

describe('resolveLiveDate', () => {
  it('uses the written date when there is one', () => {
    expect(resolveLiveDate('2026-10-14', Date.parse('2026-10-15T10:00:00Z'))).toBe('2026-10-14');
  });

  it('uses the day of sending in Kyiv, and counts a message sent in the small hours for the day before', () => {
    expect(resolveLiveDate(undefined, Date.parse('2026-10-15T09:00:00Z'))).toBe('2026-10-15');
    expect(resolveLiveDate(undefined, Date.parse('2026-10-15T21:40:00Z'))).toBe('2026-10-15');
    expect(resolveLiveDate(undefined, Date.parse('2026-10-15T22:40:00Z'))).toBe('2026-10-15');
    expect(resolveLiveDate(undefined, Date.parse('2026-10-16T02:30:00Z'))).toBe('2026-10-15');
    expect(resolveLiveDate(undefined, Date.parse('2026-10-16T03:30:00Z'))).toBe('2026-10-16');
  });
});

describe('applyLiveOrders', () => {
  it('keeps only the latest count per day, including an edited message', () => {
    const first = applyLiveOrders(EMPTY, { date: '2026-10-15', count: 4, messageId: 1, lastMessageAt: 1000 });
    const second = applyLiveOrders(first, { date: '2026-10-15', count: 6, messageId: 1, lastMessageAt: 2000 });
    expect(second.liveOrders).toEqual([{ date: '2026-10-15', count: 6, messageId: 1, lastMessageAt: 2000 }]);
    const other = applyLiveOrders(second, { date: '2026-10-16', count: 2, messageId: 9, lastMessageAt: 3000 });
    expect(other.liveOrders).toHaveLength(2);
  });
});

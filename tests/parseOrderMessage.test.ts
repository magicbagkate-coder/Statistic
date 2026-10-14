import { describe, expect, it } from 'vitest';

import { parseOrderMessage } from '@/orders/parseOrderMessage';

describe('parseOrderMessage', () => {
  it('reads date, shift and leader from a caption', () => {
    expect(parseOrderMessage('14.10.26, смена 2, руководитель Наташа', '2026')).toEqual({
      caption: { date: '2026-10-14', shift: 2, leader: 'Наташа' },
      orderIds: [],
    });
  });

  it('accepts a four digit year, a missing year and a missing leader', () => {
    expect(parseOrderMessage('5.10.2026 Смена 1', '2026').caption).toEqual({ date: '2026-10-05', shift: 1, leader: '' });
    expect(parseOrderMessage('05.10, смена 1', '2026').caption?.date).toBe('2026-10-05');
  });

  it('reads order numbers written one per line', () => {
    expect(parseOrderMessage('8800456\n8800748\r\n 8800920 ', '2026')).toEqual({
      caption: undefined,
      orderIds: [8800456, 8800748, 8800920],
    });
  });

  it('does not treat a header without a date as a caption but still reads the numbers', () => {
    const parsed = parseOrderMessage('Смена 2(Наташа)\n\n8800456\n8800748', '2026');
    expect(parsed.caption).toBeUndefined();
    expect(parsed.orderIds).toEqual([8800456, 8800748]);
  });

  it('reads a caption and the numbers from one message', () => {
    const parsed = parseOrderMessage('14.10.26, смена 1\n8800456', '2026');
    expect(parsed.caption?.shift).toBe(1);
    expect(parsed.orderIds).toEqual([8800456]);
  });

  it('ignores ordinary chatter', () => {
    expect(parseOrderMessage('всем привет, вот заказы', '2026')).toEqual({ caption: undefined, orderIds: [] });
  });
});

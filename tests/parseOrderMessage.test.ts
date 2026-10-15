import { describe, expect, it } from 'vitest';

import { parseOrderMessage } from '@/orders/parseOrderMessage';

describe('parseOrderMessage', () => {
  it('reads date, shift and leader from a one line caption', () => {
    expect(parseOrderMessage('14.10.26, смена 2, руководитель Наташа', '2026')).toEqual({
      caption: { date: '2026-10-14', shift: 2, leader: 'Наташа' },
      orderIds: [],
    });
  });

  it('reads a caption written on separate lines, with the leader name alone', () => {
    const parsed = parseOrderMessage('Смена 1\n14.10\nОля\n\n8808297 (19689)\n8809128 (19696)', '2026');
    expect(parsed.caption).toEqual({ date: '2026-10-14', shift: 1, leader: 'Оля' });
    expect(parsed.orderIds).toEqual([8808297, 8809128]);
  });

  it('accepts a four digit year, a missing year and a missing leader', () => {
    expect(parseOrderMessage('5.10.2026 Смена 1', '2026').caption).toEqual({ date: '2026-10-05', shift: 1, leader: '' });
    expect(parseOrderMessage('05.10, смена 1', '2026').caption?.date).toBe('2026-10-05');
  });

  it('reads order numbers written one per line, with or without the short number in brackets', () => {
    expect(parseOrderMessage('8800456\n8800748 (19658)\r\n 8800920 ', '2026')).toEqual({
      caption: undefined,
      orderIds: [8800456, 8800748, 8800920],
    });
  });

  it('does not treat a header without a date as a caption but still reads the numbers', () => {
    const parsed = parseOrderMessage('Смена 2(Наташа)\n\n8800456\n8800748', '2026');
    expect(parsed.caption).toBeUndefined();
    expect(parsed.orderIds).toEqual([8800456, 8800748]);
  });

  it('ignores ordinary chatter and the short numbers alone', () => {
    expect(parseOrderMessage('всем привет, вот заказы', '2026')).toEqual({ caption: undefined, orderIds: [] });
    expect(parseOrderMessage('19689', '2026').orderIds).toEqual([]);
  });
});

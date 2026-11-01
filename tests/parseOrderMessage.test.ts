import { describe, expect, it } from 'vitest';

import { parseOrderMessage } from '@/orders/parseOrderMessage';

describe('parseOrderMessage', () => {
  it('reads date, shift and leader from a one line caption', () => {
    expect(parseOrderMessage('14.10.26, смена 2, руководитель Наташа', '2026')).toEqual({
      caption: { date: '2026-10-14', shift: 2, leader: 'Наташа' },
      orderIds: [],
      unnumbered: [],
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
      unnumbered: [],
    });
  });

  it('does not treat a header without a date as a caption but still reads the numbers', () => {
    const parsed = parseOrderMessage('Смена 2(Наташа)\n\n8800456\n8800748', '2026');
    expect(parsed.caption).toBeUndefined();
    expect(parsed.orderIds).toEqual([8800456, 8800748]);
  });

  it('reads the orders without a number yet with their sources and keeps them out of the caption', () => {
    const text = '23.10\nСмена 1\nНаташа\n\n8800456\nнет номера заказа (первый аккаунт инстаграм)\nНет номера заказа (ФБ 2)\nнет номера заказа';
    const parsed = parseOrderMessage(text, '2026');
    expect(parsed.caption).toEqual({ date: '2026-10-23', shift: 1, leader: 'Наташа' });
    expect(parsed.orderIds).toEqual([8800456]);
    expect(parsed.unnumbered).toEqual(['Инста 1', 'ФБ 2', 'Без источника']);
  });

  it('ignores ordinary chatter and the short numbers alone', () => {
    expect(parseOrderMessage('всем привет, вот заказы', '2026')).toEqual({ caption: undefined, orderIds: [], unnumbered: [] });
    expect(parseOrderMessage('19689', '2026').orderIds).toEqual([]);
  });
});

describe('parseOrderMessage: a line with just a source', () => {
  const text = '01.11\nсмена 1\nОля\n\n9128833\n9135200\nінстаграм 1\nінстаграм 1';

  it('counts it as an order without a number, with the Ukrainian spelling too, and keeps it out of the caption', () => {
    const parsed = parseOrderMessage(text, '2026');
    expect(parsed.caption).toEqual({ date: '2026-11-01', shift: 1, leader: 'Оля' });
    expect(parsed.orderIds).toEqual([9128833, 9135200]);
    expect(parsed.unnumbered).toEqual(['Инста 1', 'Инста 1']);
  });

  it('reads other ways to write a source', () => {
    const parsed = parseOrderMessage('Фб 2\nVIBER\nТік ток\nінстаграм', '2026');
    expect(parsed.unnumbered).toEqual(['ФБ 2', 'Вайбер', 'Тикток', 'Без источника']);
  });

  it('does not take a numbered order, a caption or a sentence for a source line', () => {
    const parsed = parseOrderMessage('9074378 Тикток\n01.11 инстаграм\nнужно проверить заказ из инстаграм и написать клиенту', '2026');
    expect(parsed.unnumbered).toEqual([]);
  });
});

describe('parseOrderMessage: other ways to say an order has no number yet', () => {
  const phrases = [
    'номера заказа нет (инста 1)',
    'Номера нет, инстаграм 1',
    'без номера - інстаграм 1',
    'заказ без номера (первый аккаунт инстаграм)',
    'номер отсутствует, инста 1',
    'немає номера заказу (інстаграм 1)',
    'Нет номера заказа - Инстаграм 1',
    'пока нет номера: инста 1',
  ];

  it('reads each of them as an order of the named source', () => {
    for (const phrase of phrases) expect(parseOrderMessage(phrase, '2026').unnumbered, phrase).toEqual(['Инста 1']);
  });

  it('counts the phrase without a source as an order of an unknown source', () => {
    expect(parseOrderMessage('номера заказа нет', '2026').unnumbered).toEqual(['Без источника']);
  });

  it('keeps the phrase out of the caption and does not take a numbered order for it', () => {
    const parsed = parseOrderMessage('01.11\nсмена 1\nОля\n9128833\nномера заказа нет (инста 1)', '2026');
    expect(parsed.caption).toEqual({ date: '2026-11-01', shift: 1, leader: 'Оля' });
    expect(parsed.unnumbered).toEqual(['Инста 1']);
    expect(parseOrderMessage('9128833 без номера', '2026').unnumbered).toEqual([]);
  });
});

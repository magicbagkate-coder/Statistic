import { describe, expect, it } from 'vitest';

import { readShiftEntries } from '@/schedule/readShiftEntries';

const ROWS = [
  ['Менеджер', '', '8 - 16', '16 - 24', 'вих'],
  ['График роботи', '', '1', '2', '3'],
  ['', '', 'чт', 'пт', 'сб'],
  ['Оля старшая смены', '', '8 - 16', '16 - 24', 'вих'],
  ['Аліна сервис   ', '', '8 - 24', '8 - 24', '8 - 24'],
  ['Аліна помощь', '', '', '16 - 24'],
];

describe('readShiftEntries', () => {
  it('reads the cell of the requested day and trims names', () => {
    expect(readShiftEntries(ROWS, 2)).toEqual([
      { name: 'Оля старшая смены', cell: '16 - 24' },
      { name: 'Аліна сервис', cell: '8 - 24' },
      { name: 'Аліна помощь', cell: '16 - 24' },
    ]);
  });

  it('returns an empty cell for rows shorter than the day column', () => {
    expect(readShiftEntries(ROWS, 3).at(-1)).toEqual({ name: 'Аліна помощь', cell: '' });
  });

  it('fails when the day is missing in the header', () => {
    expect(() => readShiftEntries(ROWS, 9)).toThrow('Day 9 not found');
  });
});

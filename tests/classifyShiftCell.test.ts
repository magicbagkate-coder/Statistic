import { describe, expect, it } from 'vitest';

import { classifyShiftCell } from '@/schedule/classifyShiftCell';

describe('classifyShiftCell', () => {
  it('treats cells ending at 16 as the first shift, including a late start', () => {
    expect(classifyShiftCell('8 - 16')).toBe(1);
    expect(classifyShiftCell('9 - 16')).toBe(1);
  });

  it('treats cells ending at 24 and starting at 16 or later as the second shift', () => {
    expect(classifyShiftCell('16 - 24')).toBe(2);
    expect(classifyShiftCell('17 - 24')).toBe(2);
  });

  it('puts service, days off and empty cells in no shift', () => {
    expect(classifyShiftCell('8 - 24')).toBeUndefined();
    expect(classifyShiftCell('вих')).toBeUndefined();
    expect(classifyShiftCell('отпуск')).toBeUndefined();
    expect(classifyShiftCell('')).toBeUndefined();
  });
});

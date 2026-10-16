import { describe, expect, it } from 'vitest';

import { kyivDayAfter } from '@/common/kyivTime';
import { shiftWindow } from '@/leads/shiftWindow';

describe('shiftWindow', () => {
  it('runs the first shift from 00:15 to 16:15 Kyiv time', () => {
    expect(shiftWindow('2026-10-14', 1)).toEqual({ from: '2026-10-13T21:15:00.000Z', to: '2026-10-14T13:15:00.000Z' });
  });

  it('runs the second shift from 16:15 to 00:10 of the next day, without overlapping the first', () => {
    const second = shiftWindow('2026-10-14', 2);
    expect(second).toEqual({ from: '2026-10-14T13:15:00.000Z', to: '2026-10-14T21:10:00.000Z' });
    expect(second.from).toBe(shiftWindow('2026-10-14', 1).to);
  });

  it('follows the winter time change in Kyiv', () => {
    expect(shiftWindow('2026-11-02', 1).to).toBe('2026-11-02T14:15:00.000Z');
  });
});

describe('kyivDayAfter', () => {
  it('moves to the next calendar day, across month ends', () => {
    expect(kyivDayAfter('2026-10-14')).toBe('2026-10-15');
    expect(kyivDayAfter('2026-10-31')).toBe('2026-11-01');
  });
});

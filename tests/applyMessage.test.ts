import { describe, expect, it } from 'vitest';

import type { AgentState } from '@/types/AgentState';

import { applyMessage } from '@/orders/applyMessage';
import { QUIET_PERIOD_MS, splitReadyBatches } from '@/orders/splitReadyBatches';

const EMPTY: AgentState = { offset: 0, batches: [], reminders: [] };
const CAPTION = { date: '2026-10-14', shift: 1 as const, leader: 'Наташа' };

describe('applyMessage', () => {
  it('opens a batch for a caption and collects order numbers that follow without duplicates', () => {
    const opened = applyMessage(EMPTY, { caption: CAPTION, orderIds: [] }, 1000);
    const first = applyMessage(opened, { orderIds: [8800456, 8800748] }, 2000);
    const second = applyMessage(first, { orderIds: [8800748, 8800920] }, 3000);
    expect(second.batches).toEqual([{ ...CAPTION, orderIds: [8800456, 8800748, 8800920], lastMessageAt: 3000 }]);
  });

  it('ignores order numbers when no caption was seen', () => {
    expect(applyMessage(EMPTY, { orderIds: [8800456] }, 1000)).toEqual(EMPTY);
  });

  it('starts a new batch for a new caption', () => {
    const first = applyMessage(EMPTY, { caption: CAPTION, orderIds: [8800456] }, 1000);
    const second = applyMessage(first, { caption: { ...CAPTION, shift: 2 }, orderIds: [8800999] }, 2000);
    expect(second.batches).toHaveLength(2);
  });
});

describe('splitReadyBatches', () => {
  const batch = { ...CAPTION, orderIds: [8800456], lastMessageAt: 1000 };

  it('keeps a batch waiting until five quiet minutes have passed', () => {
    expect(splitReadyBatches([batch], 1000 + QUIET_PERIOD_MS - 1).ready).toEqual([]);
    expect(splitReadyBatches([batch], 1000 + QUIET_PERIOD_MS).ready).toEqual([batch]);
  });

  it('never reports a batch without orders', () => {
    const empty = { ...batch, orderIds: [] };
    expect(splitReadyBatches([empty], 1000 + QUIET_PERIOD_MS * 10)).toEqual({ ready: [], waiting: [empty] });
  });
});

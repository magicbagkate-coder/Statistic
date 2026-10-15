import { describe, expect, it } from 'vitest';

import type { AgentState } from '@/types/AgentState';

import { applyMessage } from '@/orders/applyMessage';
import { batchOrderIds } from '@/orders/batchOrderIds';
import { QUIET_PERIOD_MS, splitReadyBatches } from '@/orders/splitReadyBatches';

const EMPTY: AgentState = { offset: 0, batches: [], reminders: [] };
const CAPTION = { date: '2026-10-14', shift: 1 as const, leader: 'Оля' };

function meta(messageId: number, sentAt: number, edited = false): { messageId: number; sentAt: number; edited: boolean } {
  return { messageId, sentAt, edited };
}

describe('applyMessage', () => {
  it('opens a batch for a caption and collects order numbers that follow without duplicates', () => {
    const opened = applyMessage(EMPTY, { caption: CAPTION, orderIds: [] }, meta(1, 1000));
    const first = applyMessage(opened, { orderIds: [8800456, 8800748] }, meta(2, 2000));
    const second = applyMessage(first, { orderIds: [8800748, 8800920] }, meta(3, 3000));
    expect(batchOrderIds(second.batches[0])).toEqual([8800456, 8800748, 8800920]);
    expect(second.batches[0].lastMessageAt).toBe(3000);
  });

  it('ignores order numbers when no caption was seen', () => {
    expect(applyMessage(EMPTY, { orderIds: [8800456] }, meta(1, 1000))).toEqual(EMPTY);
  });

  it('starts a new batch for a new caption', () => {
    const first = applyMessage(EMPTY, { caption: CAPTION, orderIds: [8800456] }, meta(1, 1000));
    const second = applyMessage(first, { caption: { ...CAPTION, shift: 2 }, orderIds: [8800999] }, meta(2, 2000));
    expect(second.batches).toHaveLength(2);
  });

  it('replaces the contribution of an edited message instead of adding to it', () => {
    const original = applyMessage(EMPTY, { caption: CAPTION, orderIds: [8800456] }, meta(1, 1000));
    const edited = applyMessage(original, { caption: CAPTION, orderIds: [8800456, 8800748] }, meta(1, 5000, true));
    expect(edited.batches).toHaveLength(1);
    expect(batchOrderIds(edited.batches[0])).toEqual([8800456, 8800748]);
    expect(edited.batches[0].lastMessageAt).toBe(5000);
  });

  it('lets an edited caption fix the date, shift and leader of its batch', () => {
    const original = applyMessage(EMPTY, { caption: CAPTION, orderIds: [8800456] }, meta(1, 1000));
    const edited = applyMessage(original, { caption: { ...CAPTION, shift: 2, leader: 'Наташа' }, orderIds: [8800456] }, meta(1, 2000, true));
    expect(edited.batches[0]).toMatchObject({ shift: 2, leader: 'Наташа' });
  });

  it('treats an edit of an unknown message like a new message', () => {
    const state = applyMessage(EMPTY, { caption: CAPTION, orderIds: [8800456] }, meta(9, 1000, true));
    expect(state.batches).toHaveLength(1);
  });
});

describe('splitReadyBatches', () => {
  const batch = { ...CAPTION, parts: [{ messageId: 1, orderIds: [8800456] }], lastMessageAt: 1000 };

  it('keeps a batch waiting until five quiet minutes have passed', () => {
    expect(splitReadyBatches([batch], 1000 + QUIET_PERIOD_MS - 1).ready).toEqual([]);
    expect(splitReadyBatches([batch], 1000 + QUIET_PERIOD_MS).ready).toEqual([batch]);
  });

  it('never reports a batch without orders', () => {
    const empty = { ...batch, parts: [{ messageId: 1, orderIds: [] }] };
    expect(splitReadyBatches([empty], 1000 + QUIET_PERIOD_MS * 10)).toEqual({ ready: [], waiting: [empty] });
  });
});

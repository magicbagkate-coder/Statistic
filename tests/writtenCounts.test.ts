import { describe, expect, it, vi } from 'vitest';

import type { StateStore } from '@/storage/StateStore';
import type { AgentState } from '@/types/AgentState';

import { DayRowStore } from '@/storage/DayRowStore';

const entry = (date: string, count: number, messageId: number): { date: string; count: number; messageId: number; lastMessageAt: number } => ({ date, count, messageId, lastMessageAt: 0 });

describe('DayRowStore.writtenCounts', () => {
  const state: AgentState = {
    offset: 0,
    batches: [],
    liveOrders: [],
    exchanges: [entry('2026-11-01', 2, 1), entry('2026-10-31', 5, 2)],
    tiktok: [entry('2026-11-01', 1, 3)],
    reminders: [],
  };
  const store = new DayRowStore({ load: vi.fn(() => Promise.resolve(state)) } as unknown as StateStore);

  it('sums the exchange and TikTok orders of the day, even before the quiet period has passed', async () => {
    expect(await store.writtenCounts('2026-11-01')).toEqual({ exchanges: 2, tiktok: 1 });
    expect(await store.writtenCounts('2026-11-02')).toEqual({ exchanges: 0, tiktok: 0 });
  });
});

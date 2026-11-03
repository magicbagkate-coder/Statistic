import { describe, expect, it, vi } from 'vitest';

import type { MessageLogStore } from '@/storage/MessageLogStore';
import type { StateStore } from '@/storage/StateStore';
import type { TelegramService } from '@/telegram/TelegramService';
import type { AgentState } from '@/types/AgentState';

import { correctSourceWords } from '@/orders/correctSourceWords';
import { OrderIntakeService } from '@/orders/OrderIntakeService';
import { parseOrderMessage } from '@/orders/parseOrderMessage';

const NOW = 1_000_000_000;
const MINUTE = 60_000;
const entry = (messageId: number, minutesAgo: number): { date: string; count: number; messageId: number; lastMessageAt: number } => ({ date: '2026-11-02', count: 1, messageId, lastMessageAt: NOW - minutesAgo * MINUTE });

function build(state: Partial<AgentState>): OrderIntakeService {
  const saved: AgentState = { offset: 0, batches: [], liveOrders: [], exchanges: [], tiktok: [], reminders: [], ...state };
  const telegram = { fetchOrderMessages: vi.fn(() => Promise.resolve({ messages: [], nextOffset: 0 })) } as unknown as TelegramService;
  const stateStore = { load: vi.fn(() => Promise.resolve(saved)), save: vi.fn(() => Promise.resolve()) } as unknown as StateStore;
  const messageLog = { append: vi.fn(() => Promise.resolve()) } as unknown as MessageLogStore;
  return new OrderIntakeService(telegram, stateStore, messageLog);
}

describe('collectReady: the live stream count of a day', () => {
  it('waits while another count of the same day (exchanges, TikTok) is still being written, so one day report carries all of them', async () => {
    const ready = await build({ liveOrders: [entry(1, 10)], exchanges: [entry(2, 1)] }).collectReady(NOW);
    expect(ready.liveOrders).toEqual([]);
    expect(ready.exchanges).toEqual([]);
  });

  it('goes once every count of the day has been quiet long enough', async () => {
    const ready = await build({ liveOrders: [entry(1, 10)], exchanges: [entry(2, 6)] }).collectReady(NOW);
    expect(ready.liveOrders).toHaveLength(1);
    expect(ready.exchanges).toHaveLength(1);
  });
});

describe('correctSourceWords', () => {
  it('fixes typos in the source names and leaves other words alone', () => {
    expect(correctSourceWords('интсаграм 1')).toBe('инстаграм 1');
    expect(correctSourceWords('фэйсбук 2')).toBe('фейсбук 2');
    expect(correctSourceWords('смена 1 оля')).toBe('смена 1 оля');
  });
});

describe('parseOrderMessage: a mistyped source line', () => {
  it('counts "інтсаграм 1" as an order of Инста 1 and keeps it out of the leader name', () => {
    const parsed = parseOrderMessage('02.11\nсмена 1\nОля\n9137101\n9153760\nінтсаграм 1 \nінстаграм 1', '2026');
    expect(parsed.unnumbered).toEqual(['Инста 1', 'Инста 1']);
    expect(parsed.caption?.leader).toBe('Оля');
  });
});

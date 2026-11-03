import { Injectable } from '@nestjs/common';

import type { LiveOrders } from '@/types/LiveOrders';
import type { WrittenCounts } from '@/types/WrittenCounts';

import { readJson, writeJson } from '@/storage/jsonFile';
import { StateStore } from '@/storage/StateStore';

const DAY_ROWS_PATH = 'data/day-rows.json';

/** Remembers for which dates the "День" row has been written to the table, so it is written once; knows what is written for the day so far. */
@Injectable()
export class DayRowStore {
  constructor(private readonly stateStore: StateStore) {}

  /** The exchange and TikTok orders written for the day so far, quiet or not: a day report sent at the deadline must not miss them. */
  async writtenCounts(date: string): Promise<WrittenCounts> {
    const state = await this.stateStore.load();
    const sumOf = (items: LiveOrders[]): number => items.filter((item) => item.date === date).reduce((sum, item) => sum + item.count, 0);
    return { exchanges: sumOf(state.exchanges), tiktok: sumOf(state.tiktok) };
  }

  async has(date: string): Promise<boolean> {
    return ((await readJson<string[]>(DAY_ROWS_PATH)) ?? []).includes(date);
  }

  async add(date: string): Promise<void> {
    const dates = (await readJson<string[]>(DAY_ROWS_PATH)) ?? [];
    await writeJson(DAY_ROWS_PATH, [...dates, date]);
  }
}

import { Injectable } from '@nestjs/common';

import { readJson, writeJson } from '@/storage/jsonFile';

const DAY_ROWS_PATH = 'data/day-rows.json';

/** Remembers for which dates the "День" row has been written to the table, so it is written once. */
@Injectable()
export class DayRowStore {
  async has(date: string): Promise<boolean> {
    return ((await readJson<string[]>(DAY_ROWS_PATH)) ?? []).includes(date);
  }

  async add(date: string): Promise<void> {
    const dates = (await readJson<string[]>(DAY_ROWS_PATH)) ?? [];
    await writeJson(DAY_ROWS_PATH, [...dates, date]);
  }
}

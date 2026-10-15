import { Injectable } from '@nestjs/common';

import type { AgentState } from '@/types/AgentState';

import { readJson, writeJson } from '@/storage/jsonFile';

const STATE_PATH = 'data/state.json';
const EMPTY_STATE: AgentState = { offset: 0, batches: [], liveOrders: [], plans: [], reminders: [] };

@Injectable()
export class StateStore {
  /** Loads the saved state; fields added in later versions fall back to empty values. */
  async load(): Promise<AgentState> {
    return { ...EMPTY_STATE, ...(await readJson<Partial<AgentState>>(STATE_PATH)) };
  }

  save(state: AgentState): Promise<void> {
    return writeJson(STATE_PATH, state);
  }
}

import { Injectable } from '@nestjs/common';

import type { AgentState } from '@/types/AgentState';

import { readJson, writeJson } from '@/storage/jsonFile';

const STATE_PATH = 'data/state.json';
const EMPTY_STATE: AgentState = { offset: 0, batches: [], reminders: [] };

@Injectable()
export class StateStore {
  async load(): Promise<AgentState> {
    return (await readJson<AgentState>(STATE_PATH)) ?? EMPTY_STATE;
  }

  save(state: AgentState): Promise<void> {
    return writeJson(STATE_PATH, state);
  }
}

import type { AgentState } from '@/types/AgentState';

/** Drops the counts a message gave before: an edited message replaces them with what it says now, so a removed line removes its count. */
export function forgetMessageCounts(state: AgentState, messageId: number): AgentState {
  const others = <Item extends { messageId: number }>(items: Item[]): Item[] => items.filter((item) => item.messageId !== messageId);
  return { ...state, liveOrders: others(state.liveOrders), exchanges: others(state.exchanges), tiktok: others(state.tiktok) };
}

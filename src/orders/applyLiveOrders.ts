import type { AgentState } from '@/types/AgentState';
import type { LiveOrders } from '@/types/LiveOrders';

/** The latest live stream count for a day wins: a repeated or edited message replaces the earlier one. */
export function applyLiveOrders(state: AgentState, entry: LiveOrders): AgentState {
  const others = state.liveOrders.filter((item) => item.date !== entry.date && item.messageId !== entry.messageId);
  return { ...state, liveOrders: [...others, entry] };
}

import type { AgentState } from '@/types/AgentState';
import type { LiveOrders } from '@/types/LiveOrders';

/** The latest exchange count for a day wins: a repeated or edited message replaces the earlier one. */
export function applyExchangeOrders(state: AgentState, entry: LiveOrders): AgentState {
  const others = state.exchanges.filter((item) => item.date !== entry.date && item.messageId !== entry.messageId);
  return { ...state, exchanges: [...others, entry] };
}

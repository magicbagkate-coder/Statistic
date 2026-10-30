import type { AgentState } from '@/types/AgentState';
import type { LiveOrders } from '@/types/LiveOrders';

/** The latest TikTok count for a day wins: a repeated or edited message replaces the earlier one. */
export function applyTiktokOrders(state: AgentState, entry: LiveOrders): AgentState {
  const others = state.tiktok.filter((item) => item.date !== entry.date && item.messageId !== entry.messageId);
  return { ...state, tiktok: [...others, entry] };
}

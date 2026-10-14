import type { AgentState } from '@/types/AgentState';
import type { ParsedMessage } from '@/types/ParsedMessage';

function uniqueIds(ids: number[]): number[] {
  return [...new Set(ids)];
}

/** A caption opens a new batch; order numbers without a caption join the latest batch (or are ignored when there is none). */
export function applyMessage(state: AgentState, parsed: ParsedMessage, sentAt: number): AgentState {
  if (parsed.caption) {
    const batch = { ...parsed.caption, orderIds: uniqueIds(parsed.orderIds), lastMessageAt: sentAt };
    return { ...state, batches: [...state.batches, batch] };
  }
  const latest = state.batches.at(-1);
  if (!latest || parsed.orderIds.length === 0) return state;
  const updated = { ...latest, orderIds: uniqueIds([...latest.orderIds, ...parsed.orderIds]), lastMessageAt: sentAt };
  return { ...state, batches: [...state.batches.slice(0, -1), updated] };
}

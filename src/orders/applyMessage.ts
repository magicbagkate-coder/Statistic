import type { AgentState } from '@/types/AgentState';
import type { MessageMeta } from '@/types/MessageMeta';
import type { OrderBatch } from '@/types/OrderBatch';
import type { ParsedMessage } from '@/types/ParsedMessage';

function uniqueIds(ids: number[]): number[] {
  return [...new Set(ids)];
}

function hasPart(batch: OrderBatch, messageId: number): boolean {
  return batch.parts.some((part) => part.messageId === messageId);
}

/** An edited message replaces what it contributed before, including its caption when it opened the batch. */
function replacePart(batch: OrderBatch, parsed: ParsedMessage, meta: MessageMeta): OrderBatch {
  const parts = batch.parts.map((part) => (part.messageId === meta.messageId ? { ...part, orderIds: uniqueIds(parsed.orderIds) } : part));
  const opensBatch = batch.parts[0].messageId === meta.messageId;
  return { ...batch, ...(opensBatch ? parsed.caption : undefined), parts, lastMessageAt: meta.sentAt };
}

function addPart(state: AgentState, parsed: ParsedMessage, meta: MessageMeta): AgentState {
  const part = { messageId: meta.messageId, orderIds: uniqueIds(parsed.orderIds) };
  if (parsed.caption) return { ...state, batches: [...state.batches, { ...parsed.caption, parts: [part], lastMessageAt: meta.sentAt }] };
  const latest = state.batches.at(-1);
  if (!latest || part.orderIds.length === 0) return state;
  const updated = { ...latest, parts: [...latest.parts, part], lastMessageAt: meta.sentAt };
  return { ...state, batches: [...state.batches.slice(0, -1), updated] };
}

/**
 * A caption opens a new batch; order numbers without a caption join the latest batch (or are ignored when there is none).
 * An edited message updates the batch it already belongs to.
 */
export function applyMessage(state: AgentState, parsed: ParsedMessage, meta: MessageMeta): AgentState {
  if (meta.edited && state.batches.some((batch) => hasPart(batch, meta.messageId))) {
    return { ...state, batches: state.batches.map((batch) => (hasPart(batch, meta.messageId) ? replacePart(batch, parsed, meta) : batch)) };
  }
  return addPart(state, parsed, meta);
}

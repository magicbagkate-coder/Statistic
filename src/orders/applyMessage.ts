import type { AgentState } from '@/types/AgentState';
import type { MessageMeta } from '@/types/MessageMeta';
import type { OrderBatch } from '@/types/OrderBatch';
import type { OrderCaption } from '@/types/OrderCaption';
import type { OrderPart } from '@/types/OrderPart';
import type { ParsedMessage } from '@/types/ParsedMessage';

import { countListedOrders } from '@/orders/countListedOrders';

function uniqueIds(ids: number[]): number[] {
  return [...new Set(ids)];
}

function toPart(parsed: ParsedMessage, meta: MessageMeta): OrderPart {
  return { messageId: meta.messageId, orderIds: uniqueIds(parsed.orderIds), unnumbered: parsed.unnumbered ?? [] };
}

function hasPart(batch: OrderBatch, messageId: number): boolean {
  return batch.parts.some((part) => part.messageId === messageId);
}

/** An edited message replaces what it contributed before, including its caption when it opened the batch. */
function replacePart(batch: OrderBatch, parsed: ParsedMessage, meta: MessageMeta): OrderBatch {
  const parts = batch.parts.map((part) => (part.messageId === meta.messageId ? toPart(parsed, meta) : part));
  const opensBatch = batch.parts[0].messageId === meta.messageId;
  return { ...batch, ...(opensBatch ? parsed.caption : undefined), parts, lastMessageAt: meta.sentAt };
}

/**
 * A caption opens a batch for its date and shift. When that shift already has an open batch (the manager sent the list
 * again, or fixed the caption by sending a new message), the new message joins it instead of making a second report.
 */
function openOrJoinBatch(state: AgentState, request: { caption: OrderCaption; part: OrderPart; sentAt: number }): AgentState {
  const { caption, part, sentAt } = request;
  const existing = state.batches.find((batch) => batch.date === caption.date && batch.shift === caption.shift);
  if (!existing) return { ...state, batches: [...state.batches, { ...caption, parts: [part], lastMessageAt: sentAt }] };
  const joined = { ...existing, leader: caption.leader || existing.leader, parts: [...existing.parts, part], lastMessageAt: sentAt };
  return { ...state, batches: [...state.batches.filter((batch) => batch !== existing), joined] };
}

function addPart(state: AgentState, parsed: ParsedMessage, meta: MessageMeta): AgentState {
  const part = toPart(parsed, meta);
  if (parsed.caption) return openOrJoinBatch(state, { caption: parsed.caption, part, sentAt: meta.sentAt });
  const latest = state.batches.at(-1);
  if (!latest || countListedOrders(part) === 0) return state;
  const updated = { ...latest, parts: [...latest.parts, part], lastMessageAt: meta.sentAt };
  return { ...state, batches: [...state.batches.slice(0, -1), updated] };
}

/**
 * A caption opens a new batch (or joins the open one of the same date and shift); order numbers without a caption
 * join the latest batch (or are ignored when there is none). An edited message updates the batch it already belongs to.
 */
export function applyMessage(state: AgentState, parsed: ParsedMessage, meta: MessageMeta): AgentState {
  if (meta.edited && state.batches.some((batch) => hasPart(batch, meta.messageId))) {
    return { ...state, batches: state.batches.map((batch) => (hasPart(batch, meta.messageId) ? replacePart(batch, parsed, meta) : batch)) };
  }
  return addPart(state, parsed, meta);
}

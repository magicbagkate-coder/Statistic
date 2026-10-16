import { Injectable } from '@nestjs/common';

import type { AgentState } from '@/types/AgentState';
import type { LiveOrders } from '@/types/LiveOrders';
import type { OrderBatch } from '@/types/OrderBatch';
import type { ParsedLive } from '@/types/ParsedLive';
import type { ReadyItems } from '@/types/ReadyItems';
import type { TelegramMessage } from '@/types/TelegramMessage';

import { kyivToday } from '@/common/kyivTime';
import { applyLiveOrders } from '@/orders/applyLiveOrders';
import { applyMessage } from '@/orders/applyMessage';
import { dropStaleBatches } from '@/orders/dropStaleBatches';
import { isChatter } from '@/orders/isChatter';
import { parseLiveOrders } from '@/orders/parseLiveOrders';
import { parseOrderMessage } from '@/orders/parseOrderMessage';
import { resolveWorkingDate } from '@/orders/resolveWorkingDate';
import { QUIET_PERIOD_MS, splitReadyBatches } from '@/orders/splitReadyBatches';
import { REPORT_TEXTS } from '@/report/reportTexts';
import { MessageLogStore } from '@/storage/MessageLogStore';
import { StateStore } from '@/storage/StateStore';
import { TelegramService } from '@/telegram/TelegramService';

@Injectable()
export class OrderIntakeService {
  constructor(
    private readonly telegram: TelegramService,
    private readonly stateStore: StateStore,
    private readonly messageLog: MessageLogStore,
  ) {}

  /** Reads the orders group and returns what has been quiet long enough to be reported. */
  async collectReady(now: number): Promise<ReadyItems> {
    const state = await this.stateStore.load();
    const { messages, nextOffset } = await this.telegram.fetchOrderMessages(state.offset);
    await this.messageLog.append(messages);
    const updated = await this.applyMessages(state, messages);
    const batches = dropStaleBatches(updated.batches, now);
    await this.stateStore.save({ ...updated, batches, offset: nextOffset });
    return {
      batches: splitReadyBatches(batches, now).ready,
      liveOrders: updated.liveOrders.filter((entry) => now - entry.lastMessageAt >= QUIET_PERIOD_MS),
    };
  }

  /** Removes a reported (or failed) batch so it is not processed again. */
  async completeBatch(batch: OrderBatch): Promise<void> {
    const state = await this.stateStore.load();
    const isSame = (item: OrderBatch): boolean =>
      item.date === batch.date && item.shift === batch.shift && item.lastMessageAt === batch.lastMessageAt;
    await this.stateStore.save({ ...state, batches: state.batches.filter((item) => !isSame(item)) });
  }

  /** Removes a reported (or failed) live stream message so it is not processed again. */
  async completeLiveOrders(entry: LiveOrders): Promise<void> {
    const state = await this.stateStore.load();
    const isSame = (item: LiveOrders): boolean => item.date === entry.date && item.messageId === entry.messageId;
    await this.stateStore.save({ ...state, liveOrders: state.liveOrders.filter((item) => !isSame(item)) });
  }

  private async applyMessages(state: AgentState, messages: TelegramMessage[]): Promise<AgentState> {
    const year = kyivToday().slice(0, 4);
    let current = state;
    for (const message of messages) current = await this.applyOne(current, message, year);
    return current;
  }

  /** A message is a live stream count, chatter about a plan or progress (ignored), or (otherwise) a shift caption and order numbers. */
  private async applyOne(state: AgentState, message: TelegramMessage, year: string): Promise<AgentState> {
    const live = parseLiveOrders(message.text, year);
    if (live) return this.applyLiveMessage(state, { live, message });
    if (isChatter(message.text)) return state;
    return this.applyOrderMessage(state, { message, year });
  }

  private applyLiveMessage(state: AgentState, request: { live: ParsedLive; message: TelegramMessage }): AgentState {
    const { live, message } = request;
    const date = resolveWorkingDate(live.date, message.sentAt);
    return applyLiveOrders(state, { date, count: live.count, messageId: message.messageId, lastMessageAt: message.sentAt });
  }

  private async applyOrderMessage(state: AgentState, request: { message: TelegramMessage; year: string }): Promise<AgentState> {
    const { message, year } = request;
    const parsed = parseOrderMessage(message.text, year);
    if (parsed.orderIds.length > 0 && !parsed.caption && state.batches.length === 0) {
      await this.telegram.sendToOrdersChat(REPORT_TEXTS.missingCaption);
    }
    return applyMessage(state, parsed, message);
  }
}

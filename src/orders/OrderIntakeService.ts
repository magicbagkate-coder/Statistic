import { Injectable } from '@nestjs/common';

import type { AgentState } from '@/types/AgentState';
import type { OrderBatch } from '@/types/OrderBatch';
import type { TelegramMessage } from '@/types/TelegramMessage';

import { kyivToday } from '@/common/kyivTime';
import { applyMessage } from '@/orders/applyMessage';
import { parseOrderMessage } from '@/orders/parseOrderMessage';
import { splitReadyBatches } from '@/orders/splitReadyBatches';
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

  /** Reads the orders group and returns batches that have been quiet long enough to be reported. */
  async collectReadyBatches(now: number): Promise<OrderBatch[]> {
    const state = await this.stateStore.load();
    const { messages, nextOffset } = await this.telegram.fetchOrderMessages(state.offset);
    await this.messageLog.append(messages);
    const updated = await this.applyMessages(state, messages);
    await this.stateStore.save({ ...updated, offset: nextOffset });
    return splitReadyBatches(updated.batches, now).ready;
  }

  /** Removes a reported (or failed) batch so it is not processed again. */
  async completeBatch(batch: OrderBatch): Promise<void> {
    const state = await this.stateStore.load();
    const isSame = (item: OrderBatch): boolean =>
      item.date === batch.date && item.shift === batch.shift && item.lastMessageAt === batch.lastMessageAt;
    await this.stateStore.save({ ...state, batches: state.batches.filter((item) => !isSame(item)) });
  }

  private async applyMessages(state: AgentState, messages: TelegramMessage[]): Promise<AgentState> {
    const year = kyivToday().slice(0, 4);
    let current = state;
    for (const message of messages) {
      const parsed = parseOrderMessage(message.text, year);
      if (parsed.orderIds.length > 0 && !parsed.caption && current.batches.length === 0) {
        await this.telegram.sendToOrdersChat(REPORT_TEXTS.missingCaption);
      }
      current = applyMessage(current, parsed, message);
    }
    return current;
  }
}

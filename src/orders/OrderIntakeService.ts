import { Injectable } from '@nestjs/common';

import type { OrderBatch } from '@/types/OrderBatch';

import { kyivToday } from '@/common/kyivTime';
import { AppConfigService } from '@/config/AppConfigService';
import { applyMessage } from '@/orders/applyMessage';
import { parseOrderMessage } from '@/orders/parseOrderMessage';
import { splitReadyBatches } from '@/orders/splitReadyBatches';
import { StateStore } from '@/storage/StateStore';
import { TelegramService } from '@/telegram/TelegramService';

@Injectable()
export class OrderIntakeService {
  constructor(
    private readonly telegram: TelegramService,
    private readonly stateStore: StateStore,
    private readonly appConfig: AppConfigService,
  ) {}

  /** Reads the orders group and returns batches that have been quiet long enough to be reported. */
  async collectReadyBatches(now: number): Promise<OrderBatch[]> {
    const state = await this.stateStore.load();
    const { messages, nextOffset } = await this.telegram.fetchMessages(state.offset);
    const year = kyivToday().slice(0, 4);
    const updated = messages
      .filter((message) => message.chatId === this.appConfig.config.ordersChatId)
      .reduce((current, message) => applyMessage(current, parseOrderMessage(message.text, year), message.sentAt), state);
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
}

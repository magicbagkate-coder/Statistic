import { Injectable } from '@nestjs/common';

import type { TelegramMessage } from '@/types/TelegramMessage';
import type { TelegramUpdates } from '@/types/TelegramUpdates';

import { AppConfigService } from '@/config/AppConfigService';

type RawUpdate = {
  update_id: number;
  message?: { date: number; text?: string; caption?: string; chat: { id: number } };
};

@Injectable()
export class TelegramService {
  constructor(private readonly appConfig: AppConfigService) {}

  /** Reads new messages after the offset; the next offset confirms them so they are not delivered again. */
  async fetchMessages(offset: number): Promise<TelegramUpdates> {
    const result = await this.callApi('getUpdates', { offset, timeout: 0, allowed_updates: ['message'] });
    const updates = result as RawUpdate[];
    const lastUpdate = updates.at(-1);
    return {
      messages: updates.flatMap((update) => this.toMessage(update)),
      nextOffset: lastUpdate ? lastUpdate.update_id + 1 : offset,
    };
  }

  sendToReportChat(text: string): Promise<number> {
    return this.sendMessage(this.appConfig.config.reportChatId, text);
  }

  sendToOrdersChat(text: string): Promise<number> {
    return this.sendMessage(this.appConfig.config.ordersChatId, text);
  }

  private async sendMessage(chatId: number, text: string): Promise<number> {
    const result = await this.callApi('sendMessage', { chat_id: chatId, text });
    return Reflect.get(result as object, 'message_id') as number;
  }

  private toMessage(update: RawUpdate): TelegramMessage[] {
    const message = update.message;
    if (!message) return [];
    return [{ chatId: message.chat.id, text: message.text ?? message.caption ?? '', sentAt: message.date * 1000 }];
  }

  private async callApi(method: string, payload: object): Promise<unknown> {
    const url = `https://api.telegram.org/bot${this.appConfig.config.telegramBotToken}/${method}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = (await response.json()) as object;
    if (!response.ok || Reflect.get(body, 'ok') !== true) throw new Error(`Telegram ${method} failed: ${JSON.stringify(body)}`);
    return Reflect.get(body, 'result');
  }
}

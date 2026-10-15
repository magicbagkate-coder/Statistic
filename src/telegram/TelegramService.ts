import { Injectable } from '@nestjs/common';

import type { TelegramMessage } from '@/types/TelegramMessage';
import type { TelegramUpdates } from '@/types/TelegramUpdates';

import { AppConfigService } from '@/config/AppConfigService';

type RawMessage = {
  message_id: number;
  date: number;
  edit_date?: number;
  text?: string;
  caption?: string;
  chat: { id: number };
};

type RawUpdate = {
  update_id: number;
  message?: RawMessage;
  edited_message?: RawMessage;
};

function readText(message: RawMessage): string {
  return message.text ?? message.caption ?? '';
}

/** The moment of the last change in milliseconds: the edit time for edited messages. */
function readTime(message: RawMessage): number {
  return (message.edit_date ?? message.date) * 1000;
}

@Injectable()
export class TelegramService {
  constructor(private readonly appConfig: AppConfigService) {}

  /** Reads new and edited messages of the orders group; the next offset confirms them so they are not delivered again. */
  async fetchOrderMessages(offset: number): Promise<TelegramUpdates> {
    const result = await this.callApi('getUpdates', { offset, timeout: 0, allowed_updates: ['message', 'edited_message'] });
    const updates = result as RawUpdate[];
    const lastUpdate = updates.at(-1);
    return {
      messages: updates
        .flatMap((update) => this.toMessage(update))
        .filter((message) => message.chatId === this.appConfig.config.ordersChatId),
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
    const message = update.message ?? update.edited_message;
    if (!message) return [];
    return [
      {
        chatId: message.chat.id,
        messageId: message.message_id,
        text: readText(message),
        sentAt: readTime(message),
        edited: update.edited_message !== undefined,
      },
    ];
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

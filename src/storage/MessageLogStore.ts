import { Injectable } from '@nestjs/common';

import type { TelegramMessage } from '@/types/TelegramMessage';

import { appendJsonLines } from '@/storage/jsonFile';

const LOG_PATH = 'data/messages.log';

@Injectable()
export class MessageLogStore {
  /** Keeps every message read from the orders group, so a misread list can always be checked. */
  append(messages: TelegramMessage[]): Promise<void> {
    const entries = messages.map((message) => ({ ...message, loggedAt: new Date().toISOString() }));
    return appendJsonLines(LOG_PATH, entries);
  }
}

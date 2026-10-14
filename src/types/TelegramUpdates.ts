import type { TelegramMessage } from '@/types/TelegramMessage';

export type TelegramUpdates = {
  messages: TelegramMessage[];
  nextOffset: number;
};

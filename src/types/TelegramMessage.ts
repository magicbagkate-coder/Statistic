export type TelegramMessage = {
  chatId: number;
  messageId: number;
  text: string;
  sentAt: number;
  edited: boolean;
};

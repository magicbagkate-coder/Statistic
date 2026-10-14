import { env } from 'node:process';

import { Injectable } from '@nestjs/common';

import type { AppConfig } from '@/types/AppConfig';

function readEnv(name: string): string {
  const value = env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

@Injectable()
export class AppConfigService {
  readonly config: AppConfig = {
    sitniksApiUrl: readEnv('SITNIKS_API_URL'),
    sitniksApiKey: readEnv('SITNIKS_API_KEY'),
    scheduleSpreadsheetId: readEnv('SCHEDULE_SPREADSHEET_ID'),
    telegramBotToken: readEnv('TELEGRAM_BOT_TOKEN'),
    ordersChatId: Number(readEnv('TELEGRAM_ORDERS_CHAT_ID')),
    reportChatId: Number(readEnv('TELEGRAM_REPORT_CHAT_ID')),
  };
}

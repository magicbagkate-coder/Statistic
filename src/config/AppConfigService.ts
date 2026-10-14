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
    anthropicApiKey: readEnv('ANTHROPIC_API_KEY'),
    sitniksApiUrl: readEnv('SITNIKS_API_URL'),
    sitniksApiKey: readEnv('SITNIKS_API_KEY'),
    googleCredentialsPath: readEnv('GOOGLE_CREDENTIALS_PATH'),
    spreadsheetId: readEnv('GOOGLE_SPREADSHEET_ID'),
  };
}

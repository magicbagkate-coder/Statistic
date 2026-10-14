import { Injectable } from '@nestjs/common';

import type { SalesStats } from '@/types/SalesStats';

import { AppConfigService } from '@/config/AppConfigService';

@Injectable()
export class SheetsService {
  constructor(private readonly appConfig: AppConfigService) {}

  async appendStatsRow(stats: SalesStats): Promise<void> {
    throw new Error(`Not implemented: Google Sheets writer (${this.appConfig.config.spreadsheetId}, ${stats.collectedAt})`);
  }
}

import { Injectable } from '@nestjs/common';

import { SheetsService } from '@/sheets/SheetsService';
import { SitniksService } from '@/sitniks/SitniksService';

@Injectable()
export class StatsAgentService {
  constructor(
    private readonly sitniks: SitniksService,
    private readonly sheets: SheetsService,
  ) {}

  async runCollection(): Promise<void> {
    const stats = await this.sitniks.fetchSalesStats();
    await this.sheets.appendStatsRow(stats);
  }
}

import { Module } from '@nestjs/common';

import { StatsAgentService } from '@/agent/StatsAgentService';
import { AppConfigService } from '@/config/AppConfigService';
import { SheetsService } from '@/sheets/SheetsService';
import { SitniksService } from '@/sitniks/SitniksService';

@Module({
  providers: [AppConfigService, SitniksService, SheetsService, StatsAgentService],
})
export class AppModule {}

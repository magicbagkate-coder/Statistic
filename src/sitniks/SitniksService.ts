import { Injectable } from '@nestjs/common';

import type { SalesStats } from '@/types/SalesStats';

import { AppConfigService } from '@/config/AppConfigService';

@Injectable()
export class SitniksService {
  constructor(private readonly appConfig: AppConfigService) {}

  async fetchSalesStats(): Promise<SalesStats> {
    throw new Error(`Not implemented: waiting for Sitniks API docs (${this.appConfig.config.sitniksApiUrl})`);
  }
}

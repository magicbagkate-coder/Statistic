import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';

import type { OrderBatch } from '@/types/OrderBatch';

import { describeError } from '@/common/describeError';
import { batchOrderIds } from '@/orders/batchOrderIds';
import { OrderIntakeService } from '@/orders/OrderIntakeService';
import { ReportDeliveryService } from '@/report/ReportDeliveryService';
import { ReportService } from '@/report/ReportService';

const POLL_INTERVAL_MS = 30_000;

@Injectable()
export class IntakeJobs {
  private readonly logger = new Logger(IntakeJobs.name);
  private isRunning = false;

  constructor(
    private readonly intake: OrderIntakeService,
    private readonly reports: ReportService,
    private readonly delivery: ReportDeliveryService,
  ) {}

  @Interval(POLL_INTERVAL_MS)
  async pollOrders(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    try {
      for (const batch of await this.intake.collectReadyBatches(Date.now())) await this.processBatch(batch);
    } catch (error) {
      this.logger.error(`Order polling failed: ${describeError(error)}`);
    } finally {
      this.isRunning = false;
    }
  }

  private async processBatch(batch: OrderBatch): Promise<void> {
    try {
      const report = await this.reports.prepareReport({ batch, now: Date.now() });
      if (!report) return;
      await this.delivery.deliver(report);
      this.logger.log(`Report sent for ${batch.date}, shift ${batch.shift}, ${batchOrderIds(batch).length} orders`);
    } catch (error) {
      this.logger.error(`Report failed for ${batch.date}, shift ${batch.shift}: ${describeError(error)}`);
      await this.delivery.notifyFailure({ batch, reason: describeError(error) });
    }
    await this.intake.completeBatch(batch);
  }
}

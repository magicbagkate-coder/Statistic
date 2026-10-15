import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';

import type { LiveOrders } from '@/types/LiveOrders';
import type { OrderBatch } from '@/types/OrderBatch';
import type { PlanEntry } from '@/types/PlanEntry';

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
      const ready = await this.intake.collectReady(Date.now());
      for (const batch of ready.batches) await this.processBatch(batch, ready.plans);
      for (const entry of ready.liveOrders) await this.processLiveOrders(entry, ready.plans);
    } catch (error) {
      this.logger.error(`Order polling failed: ${describeError(error)}`);
    } finally {
      this.isRunning = false;
    }
  }

  private async processBatch(batch: OrderBatch, plans: PlanEntry[]): Promise<void> {
    try {
      const report = await this.reports.prepareReport({ batch, now: Date.now(), plans });
      if (!report) return;
      await this.delivery.deliver(report);
      this.logger.log(`Report sent for ${batch.date}, shift ${batch.shift}, ${batchOrderIds(batch).length} orders`);
    } catch (error) {
      this.logger.error(`Report failed for ${batch.date}, shift ${batch.shift}: ${describeError(error)}`);
      await this.delivery.notifyFailure({ batch, reason: describeError(error) });
    }
    await this.intake.completeBatch(batch);
  }

  private async processLiveOrders(entry: LiveOrders, plans: PlanEntry[]): Promise<void> {
    try {
      const report = await this.reports.prepareDayReport({ entry, now: Date.now(), plans });
      if (!report) return;
      await this.delivery.deliverDay(report);
      this.logger.log(`Day report sent for ${entry.date}, ${entry.count} live stream orders`);
    } catch (error) {
      this.logger.error(`Day report failed for ${entry.date}: ${describeError(error)}`);
      await this.delivery.notifyDayFailure({ date: entry.date, reason: describeError(error) });
    }
    await this.intake.completeLiveOrders(entry);
  }
}

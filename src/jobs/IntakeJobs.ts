import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';

import type { LiveOrders } from '@/types/LiveOrders';
import type { OrderBatch } from '@/types/OrderBatch';
import type { ReadyItems } from '@/types/ReadyItems';

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
      await this.processReady(await this.intake.collectReady(Date.now()));
    } catch (error) {
      this.logger.error(`Order polling failed: ${describeError(error)}`);
    } finally {
      this.isRunning = false;
    }
  }

  /** Shift lists first, then the live stream counts (the day reports take the exchange counts along), then the exchange updates. */
  private async processReady(ready: ReadyItems): Promise<void> {
    for (const batch of ready.batches) await this.processBatch(batch);
    for (const entry of ready.liveOrders) await this.processLiveOrders({ entry, exchanges: ready.exchanges });
    for (const entry of ready.exchanges) await this.processExchanges(entry);
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

  private async processLiveOrders(request: { entry: LiveOrders; exchanges: LiveOrders[] }): Promise<void> {
    const { entry, exchanges } = request;
    try {
      const exchangeCount = exchanges.find((item) => item.date === entry.date)?.count ?? 0;
      const report = await this.reports.prepareDayReport({ entry, exchanges: exchangeCount, now: Date.now() });
      if (!report) return;
      await this.delivery.deliverDay(report);
      this.logger.log(`Day report sent for ${entry.date}, ${entry.count} live stream orders`);
    } catch (error) {
      this.logger.error(`Day report failed for ${entry.date}: ${describeError(error)}`);
      await this.delivery.notifyDayFailure({ date: entry.date, reason: describeError(error) });
    }
    await this.intake.completeLiveOrders(entry);
  }

  /** A day report that went out without the exchange count (or with another one) is sent and written again with it. */
  private async processExchanges(entry: LiveOrders): Promise<void> {
    try {
      const report = await this.reports.updateDayExchanges({ date: entry.date, count: entry.count });
      if (!report) return;
      await this.delivery.deliverDay(report);
      this.logger.log(`Day report for ${entry.date} sent again with ${entry.count} exchange orders`);
    } catch (error) {
      this.logger.error(`Exchange update failed for ${entry.date}: ${describeError(error)}`);
    }
  }
}

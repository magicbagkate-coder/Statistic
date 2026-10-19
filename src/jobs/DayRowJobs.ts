import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';

import { describeError } from '@/common/describeError';
import { kyivDayBefore, kyivYesterday } from '@/common/kyivTime';
import { ReportDeliveryService } from '@/report/ReportDeliveryService';
import { ReportService } from '@/report/ReportService';
import { DayRowStore } from '@/storage/DayRowStore';

const CHECK_INTERVAL_MS = 60_000;

/**
 * Writes the "День" row of the table as soon as the day snapshot and both shift reports exist, whatever the live stream count.
 * When the service manager has written nothing by the deadline, sends the day report with zero live stream orders.
 */
@Injectable()
export class DayRowJobs {
  private readonly logger = new Logger(DayRowJobs.name);
  private isRunning = false;

  constructor(
    private readonly reports: ReportService,
    private readonly delivery: ReportDeliveryService,
    private readonly dayRows: DayRowStore,
  ) {}

  @Interval(CHECK_INTERVAL_MS)
  async writePendingDayRows(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    try {
      for (const date of [kyivDayBefore(kyivYesterday()), kyivYesterday()]) await this.writeDayRow(date);
    } catch (error) {
      this.logger.error(`Day row check failed: ${describeError(error)}`);
    } finally {
      this.isRunning = false;
    }
  }

  private async writeDayRow(date: string): Promise<void> {
    await this.writeTableRow(date);
    const fallback = await this.reports.prepareDefaultDayReport({ date, now: Date.now() });
    if (!fallback) return;
    await this.delivery.deliverDay(fallback);
    this.logger.log(`Day report sent for ${date} without a live stream count: zero live stream orders`);
  }

  private async writeTableRow(date: string): Promise<void> {
    if (await this.dayRows.has(date)) return;
    const report = await this.reports.prepareDayTableReport(date);
    if (!report) return;
    await this.dayRows.add(date);
    await this.delivery.writeDayRow(report);
    this.logger.log(`Day row written to the table for ${date}`);
  }
}

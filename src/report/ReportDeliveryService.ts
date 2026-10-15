import { Injectable } from '@nestjs/common';

import type { DayReport } from '@/types/DayReport';
import type { OrderBatch } from '@/types/OrderBatch';
import type { ShiftReport } from '@/types/ShiftReport';

import { formatDayReport } from '@/report/formatDayReport';
import { formatDate, formatReport } from '@/report/formatReport';
import { REPORT_TEXTS } from '@/report/reportTexts';
import { ReportStore } from '@/storage/ReportStore';
import { TelegramService } from '@/telegram/TelegramService';

@Injectable()
export class ReportDeliveryService {
  constructor(
    private readonly telegram: TelegramService,
    private readonly reportStore: ReportStore,
  ) {}

  /** Sends the report to the reports group and keeps a copy on the server. */
  async deliver(report: ShiftReport): Promise<void> {
    const text = formatReport(report);
    const messageId = await this.telegram.sendToReportChat(text);
    await this.reportStore.save({ report, text, messageId, sentAt: new Date().toISOString() });
  }

  /** Sends the whole-day report and keeps a copy on the server. */
  async deliverDay(report: DayReport): Promise<void> {
    const text = formatDayReport(report);
    const messageId = await this.telegram.sendToReportChat(text);
    await this.reportStore.saveDay({ report, text, messageId, sentAt: new Date().toISOString() });
  }

  async notifyFailure(request: { batch: OrderBatch; reason: string }): Promise<void> {
    const { batch, reason } = request;
    const title = `${REPORT_TEXTS.reportFailure} ${batch.shift} · ${formatDate(batch.date)}`;
    await this.telegram.sendToReportChat(`${title}\n${REPORT_TEXTS.reason}: ${reason}`);
  }

  async notifyDayFailure(request: { date: string; reason: string }): Promise<void> {
    const title = `${REPORT_TEXTS.dayFailure} · ${formatDate(request.date)}`;
    await this.telegram.sendToReportChat(`${title}\n${REPORT_TEXTS.reason}: ${request.reason}`);
  }
}

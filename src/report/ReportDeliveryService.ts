import { Injectable, Logger } from '@nestjs/common';

import type { DayReport } from '@/types/DayReport';
import type { OrderBatch } from '@/types/OrderBatch';
import type { ShiftReport } from '@/types/ShiftReport';

import { describeError } from '@/common/describeError';
import { formatDayReport } from '@/report/formatDayReport';
import { formatDate, formatReport } from '@/report/formatReport';
import { REPORT_TEXTS } from '@/report/reportTexts';
import { SheetsReportWriter } from '@/sheets/SheetsReportWriter';
import { ReportStore } from '@/storage/ReportStore';
import { TelegramService } from '@/telegram/TelegramService';

@Injectable()
export class ReportDeliveryService {
  private readonly logger = new Logger(ReportDeliveryService.name);

  constructor(
    private readonly telegram: TelegramService,
    private readonly reportStore: ReportStore,
    private readonly sheet: SheetsReportWriter,
  ) {}

  /** Sends the report to the reports group, keeps a copy on the server and adds the shift row to the table. */
  async deliver(report: ShiftReport): Promise<void> {
    const text = formatReport(report);
    const messageId = await this.telegram.sendToReportChat(text);
    await this.reportStore.save({ report, text, messageId, sentAt: new Date().toISOString() });
    await this.writeToSheet({ write: () => this.sheet.writeShift(report), date: report.date });
  }

  /** Sends the whole-day report, keeps a copy on the server and adds the day row to the table. */
  async deliverDay(report: DayReport): Promise<void> {
    const text = formatDayReport(report);
    const messageId = await this.telegram.sendToReportChat(text);
    await this.reportStore.saveDay({ report, text, messageId, sentAt: new Date().toISOString() });
    await this.writeToSheet({ write: () => this.sheet.writeDay(report), date: report.date });
  }

  /** Adds only the whole-day row to the table (no Telegram message): used when the day report waits for the live stream count. */
  writeDayRow(report: DayReport): Promise<void> {
    return this.writeToSheet({ write: () => this.sheet.writeDay(report), date: report.date });
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

  /** A failed table write never blocks the report: it is logged and the reports group is warned. */
  private async writeToSheet(request: { write: () => Promise<void>; date: string }): Promise<void> {
    try {
      await request.write();
    } catch (error) {
      this.logger.error(`Table write failed for ${request.date}: ${describeError(error)}`);
      await this.telegram.sendToReportChat(`${REPORT_TEXTS.sheetFailure} · ${formatDate(request.date)}\n${REPORT_TEXTS.reason}: ${describeError(error)}`);
    }
  }
}

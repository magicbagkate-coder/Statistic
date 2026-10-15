import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import type { ShiftNumber } from '@/types/ShiftNumber';

import { describeError } from '@/common/describeError';
import { KYIV_ZONE, kyivToday, kyivYesterday } from '@/common/kyivTime';
import { formatDate } from '@/report/formatReport';
import { REPORT_TEXTS } from '@/report/reportTexts';
import { ShiftSnapshotService } from '@/snapshots/ShiftSnapshotService';
import { TelegramService } from '@/telegram/TelegramService';

@Injectable()
export class SnapshotJobs {
  private readonly logger = new Logger(SnapshotJobs.name);

  constructor(
    private readonly snapshots: ShiftSnapshotService,
    private readonly telegram: TelegramService,
  ) {}

  /** 16:15 Kyiv: the first shift window closes, after managers had a few minutes to finish. */
  @Cron('15 16 * * *', { timeZone: KYIV_ZONE })
  snapshotFirstShift(): Promise<void> {
    return this.takeSnapshot({ date: kyivToday(), shift: 1 });
  }

  /** 00:30 Kyiv: the second shift window of the previous day closes. */
  @Cron('30 0 * * *', { timeZone: KYIV_ZONE })
  snapshotSecondShift(): Promise<void> {
    return this.takeSnapshot({ date: kyivYesterday(), shift: 2 });
  }

  private async takeSnapshot(request: { date: string; shift: ShiftNumber }): Promise<void> {
    try {
      await this.snapshots.collectShift({ ...request, save: true });
      this.logger.log(`Lead snapshot saved for ${request.date}, shift ${request.shift}`);
    } catch (error) {
      this.logger.error(`Lead snapshot failed for ${request.date}, shift ${request.shift}: ${describeError(error)}`);
      const title = `${REPORT_TEXTS.snapshotFailure} ${request.shift} · ${formatDate(request.date)}`;
      await this.telegram.sendToReportChat(`${title}\n${REPORT_TEXTS.reason}: ${describeError(error)}`);
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import type { ShiftNumber } from '@/types/ShiftNumber';

import { describeError } from '@/common/describeError';
import { KYIV_ZONE, kyivToday, kyivYesterday } from '@/common/kyivTime';
import { formatDate } from '@/report/formatReport';
import { REPORT_TEXTS } from '@/report/reportTexts';
import { DaySnapshotService } from '@/snapshots/DaySnapshotService';
import { ShiftSnapshotService } from '@/snapshots/ShiftSnapshotService';
import { TelegramService } from '@/telegram/TelegramService';

@Injectable()
export class SnapshotJobs {
  private readonly logger = new Logger(SnapshotJobs.name);

  constructor(
    private readonly shiftSnapshots: ShiftSnapshotService,
    private readonly daySnapshots: DaySnapshotService,
    private readonly telegram: TelegramService,
  ) {}

  /** 16:15 Kyiv: the first shift window closes, after managers had a few minutes to finish. */
  @Cron('15 16 * * *', { timeZone: KYIV_ZONE })
  snapshotFirstShift(): Promise<void> {
    return this.takeShiftSnapshot({ date: kyivToday(), shift: 1 });
  }

  /** 00:10 Kyiv: the second shift window and the whole working day of the previous date close. */
  @Cron('10 0 * * *', { timeZone: KYIV_ZONE })
  async snapshotSecondShift(): Promise<void> {
    const date = kyivYesterday();
    await this.takeShiftSnapshot({ date, shift: 2 });
    await this.takeDaySnapshot(date);
  }

  private async takeShiftSnapshot(request: { date: string; shift: ShiftNumber }): Promise<void> {
    try {
      await this.shiftSnapshots.collectShift({ ...request, save: true });
      this.logger.log(`Lead snapshot saved for ${request.date}, shift ${request.shift}`);
    } catch (error) {
      this.logger.error(`Lead snapshot failed for ${request.date}, shift ${request.shift}: ${describeError(error)}`);
      const title = `${REPORT_TEXTS.snapshotFailure} ${request.shift} · ${formatDate(request.date)}`;
      await this.telegram.sendToReportChat(`${title}\n${REPORT_TEXTS.reason}: ${describeError(error)}`);
    }
  }

  private async takeDaySnapshot(date: string): Promise<void> {
    try {
      await this.daySnapshots.collectDay({ date, save: true });
      this.logger.log(`Day snapshot saved for ${date}`);
    } catch (error) {
      this.logger.error(`Day snapshot failed for ${date}: ${describeError(error)}`);
      const title = `${REPORT_TEXTS.daySnapshotFailure} · ${formatDate(date)}`;
      await this.telegram.sendToReportChat(`${title}\n${REPORT_TEXTS.reason}: ${describeError(error)}`);
    }
  }
}

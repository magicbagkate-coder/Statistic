import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { describeError } from '@/common/describeError';
import { KYIV_ZONE, kyivToday, kyivYesterday } from '@/common/kyivTime';
import { ReminderService } from '@/reminders/ReminderService';

@Injectable()
export class ReminderJobs {
  private readonly logger = new Logger(ReminderJobs.name);

  constructor(private readonly reminders: ReminderService) {}

  /** 17:00 Kyiv: no first shift orders yet. */
  @Cron('0 17 * * *', { timeZone: KYIV_ZONE })
  async remindFirstShift(): Promise<void> {
    await this.remind(() => this.reminders.remindIfMissing({ date: kyivToday(), shift: 1 }));
  }

  /** 01:00 Kyiv: no second shift orders yet. */
  @Cron('0 1 * * *', { timeZone: KYIV_ZONE })
  async remindSecondShift(): Promise<void> {
    await this.remind(() => this.reminders.remindIfMissing({ date: kyivYesterday(), shift: 2 }));
  }

  private async remind(action: () => Promise<void>): Promise<void> {
    try {
      await action();
    } catch (error) {
      this.logger.error(`Reminder failed: ${describeError(error)}`);
    }
  }
}

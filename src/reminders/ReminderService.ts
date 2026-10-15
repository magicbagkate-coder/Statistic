import { Injectable } from '@nestjs/common';

import type { ShiftNumber } from '@/types/ShiftNumber';

import { batchOrderIds } from '@/orders/batchOrderIds';
import { formatDate } from '@/report/formatReport';
import { REPORT_TEXTS } from '@/report/reportTexts';
import { ReportStore } from '@/storage/ReportStore';
import { StateStore } from '@/storage/StateStore';
import { TelegramService } from '@/telegram/TelegramService';

@Injectable()
export class ReminderService {
  constructor(
    private readonly telegram: TelegramService,
    private readonly reportStore: ReportStore,
    private readonly stateStore: StateStore,
  ) {}

  /** Reminds the orders group once when the shift has neither a sent report nor orders waiting for one. */
  async remindIfMissing(request: { date: string; shift: ShiftNumber }): Promise<void> {
    const { date, shift } = request;
    const key = `${date}-shift${shift}`;
    const state = await this.stateStore.load();
    const hasBatch = state.batches.some((batch) => batch.date === date && batch.shift === shift && batchOrderIds(batch).length > 0);
    if (state.reminders.includes(key) || hasBatch || (await this.reportStore.exists(date, shift))) return;
    await this.telegram.sendToOrdersChat(
      `${REPORT_TEXTS.reminder} ${shift} · ${formatDate(date)}.\n${REPORT_TEXTS.reminderHint}`,
    );
    await this.stateStore.save({ ...state, reminders: [...state.reminders, key] });
  }
}

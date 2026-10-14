import { Injectable } from '@nestjs/common';

import type { LeadCounts } from '@/types/LeadCounts';
import type { ShiftNumber } from '@/types/ShiftNumber';

import { ShiftLeadsService } from '@/leads/ShiftLeadsService';
import { SnapshotStore } from '@/snapshots/SnapshotStore';

@Injectable()
export class ShiftSnapshotService {
  constructor(
    private readonly shiftLeads: ShiftLeadsService,
    private readonly store: SnapshotStore,
  ) {}

  /** Counts a shift from Sitniks; when asked, stores the result so the second shift can subtract the first. */
  async collectShift(request: { date: string; shift: ShiftNumber; save: boolean }): Promise<LeadCounts> {
    const { date, shift, save } = request;
    const chats = await this.shiftLeads.fetchDayChats(date);
    const firstShift = shift === 2 ? await this.store.load(date, 1) : undefined;
    const counts = await this.shiftLeads.countShift({ chats, date, shift, firstShift });
    if (save) await this.store.save({ date, shift, counts });
    return counts;
  }
}

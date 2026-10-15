import { Injectable } from '@nestjs/common';

import type { DayCounts } from '@/types/DayCounts';

import { LeadsService } from '@/leads/LeadsService';
import { dayWindow } from '@/leads/shiftWindow';
import { SitniksService } from '@/sitniks/SitniksService';
import { SnapshotStore } from '@/snapshots/SnapshotStore';

@Injectable()
export class DaySnapshotService {
  constructor(
    private readonly sitniks: SitniksService,
    private readonly leads: LeadsService,
    private readonly store: SnapshotStore,
  ) {}

  /** Counts the whole working day without choosing managers, plus the service manager's separate statuses. */
  async collectDay(request: { date: string; save: boolean }): Promise<DayCounts> {
    const chats = await this.sitniks.fetchChats(dayWindow(request.date));
    const counts = { day: this.leads.countLeads(chats), service: this.leads.countServiceLeads(chats) };
    if (request.save) await this.store.saveDay({ date: request.date, counts });
    return counts;
  }
}

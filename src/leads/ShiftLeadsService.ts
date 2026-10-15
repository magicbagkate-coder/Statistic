import { Injectable } from '@nestjs/common';

import type { Chat } from '@/types/Chat';
import type { LeadCounts } from '@/types/LeadCounts';
import type { ShiftNumber } from '@/types/ShiftNumber';

import { LeadsService } from '@/leads/LeadsService';
import { mergeSecondShift } from '@/leads/mergeSecondShift';
import { shiftWindow } from '@/leads/shiftWindow';
import { ScheduleService } from '@/schedule/ScheduleService';
import { SitniksService } from '@/sitniks/SitniksService';

@Injectable()
export class ShiftLeadsService {
  constructor(
    private readonly sitniks: SitniksService,
    private readonly schedule: ScheduleService,
    private readonly leads: LeadsService,
  ) {}

  /** Fetches the chats whose last message falls into the shift window. */
  fetchShiftChats(request: { date: string; shift: ShiftNumber }): Promise<Chat[]> {
    return this.sitniks.fetchChats(shiftWindow(request.date, request.shift));
  }

  /** Counts a shift from the chats of its own window. */
  async countShift(request: { chats: Chat[]; date: string; shift: ShiftNumber }): Promise<LeadCounts> {
    const { chats, date, shift } = request;
    const managers = await this.schedule.findShiftManagers({ date, shift });
    const direct = this.leads.countLeads(chats, managers);
    if (shift === 1) return direct;
    const firstManagers = await this.schedule.findShiftManagers({ date, shift: 1 });
    const bothShifts = this.leads.countLeads(chats, [...new Set([...firstManagers, ...managers])]);
    return mergeSecondShift({ direct, bothShifts });
  }
}

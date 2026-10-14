import { Injectable } from '@nestjs/common';

import type { Chat } from '@/types/Chat';
import type { LeadCounts } from '@/types/LeadCounts';
import type { ShiftNumber } from '@/types/ShiftNumber';

import { kyivLocalToIso } from '@/common/kyivTime';
import { LeadsService } from '@/leads/LeadsService';
import { mergeSecondShift } from '@/leads/mergeSecondShift';
import { ScheduleService } from '@/schedule/ScheduleService';
import { SitniksService } from '@/sitniks/SitniksService';

@Injectable()
export class ShiftLeadsService {
  constructor(
    private readonly sitniks: SitniksService,
    private readonly schedule: ScheduleService,
    private readonly leads: LeadsService,
  ) {}

  /** Fetches every chat with a message on the Kyiv date (YYYY-MM-DD). */
  fetchDayChats(date: string): Promise<Chat[]> {
    return this.sitniks.fetchChats({ from: kyivLocalToIso(date, '00:00:00'), to: kyivLocalToIso(date, '23:59:59') });
  }

  /** Counts a shift. The second shift needs the first shift snapshot to subtract from the whole-day general leads. */
  async countShift(request: { chats: Chat[]; date: string; shift: ShiftNumber; firstShift?: LeadCounts }): Promise<LeadCounts> {
    const { chats, date, shift, firstShift } = request;
    const managers = await this.schedule.findShiftManagers({ date, shift });
    const direct = this.leads.countLeads(chats, managers);
    if (shift === 1) return direct;
    if (!firstShift) throw new Error(`No first shift snapshot for ${date}: it is needed to count the second shift`);
    const firstManagers = await this.schedule.findShiftManagers({ date, shift: 1 });
    const bothShifts = this.leads.countLeads(chats, [...new Set([...firstManagers, ...managers])]);
    return mergeSecondShift({ direct, bothShifts, firstShift });
  }
}

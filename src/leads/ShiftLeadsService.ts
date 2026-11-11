import { Injectable } from '@nestjs/common';

import type { Chat } from '@/types/Chat';
import type { LeadCounts } from '@/types/LeadCounts';
import type { ShiftManagers } from '@/types/ShiftManagers';
import type { ShiftNumber } from '@/types/ShiftNumber';

import { describeError } from '@/common/describeError';
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

  /**
   * Counts a shift from the chats of its own window by the managers the schedule puts on it.
   * When the schedule cannot be matched with the managers tab (or cannot be read), the shift is counted by the managers
   * who actually have chats in the window, and the problems are returned so that someone fixes the tables.
   */
  async countShift(request: { chats: Chat[]; date: string; shift: ShiftNumber }): Promise<LeadCounts> {
    const { chats, date, shift } = request;
    const managers = await this.lookupManagers({ date, shift });
    const first = shift === 1 ? managers : await this.lookupManagers({ date, shift: 1 });
    const problems = [...new Set([...managers.problems, ...first.problems])];
    if (problems.length > 0) return { ...this.leads.countLeads(chats, this.leads.findResponders(chats)), problems };
    const direct = this.leads.countLeads(chats, managers.names);
    if (shift === 1) return direct;
    const bothShifts = this.leads.countLeads(chats, [...new Set([...first.names, ...managers.names])]);
    return mergeSecondShift({ direct, bothShifts });
  }

  private async lookupManagers(request: { date: string; shift: ShiftNumber }): Promise<ShiftManagers> {
    try {
      return await this.schedule.findShiftManagers(request);
    } catch (error) {
      return { names: [], problems: [`график недоступен: ${describeError(error)}`] };
    }
  }
}

import { Injectable } from '@nestjs/common';

import type { Chat } from '@/types/Chat';
import type { LeadCounts } from '@/types/LeadCounts';
import type { ServiceCounts } from '@/types/ServiceCounts';
import type { SourceCount } from '@/types/SourceCount';

import { findSourceLabel } from '@/leads/leadSources';
import {
  FACEBOOK_STATUS,
  LEAD_STATUSES,
  LIVE_STREAM_STATUS,
  NEW_BOT_STATUS,
  RETURNS_STATUS,
  SERVICE_MANAGER_NAME,
  SERVICE_REQUEST_STATUS,
  TARGET_STATUSES,
} from '@/leads/leadStatuses';

@Injectable()
export class LeadsService {
  /** Counts leads among chats of the given managers plus chats without a manager. */
  countLeads(chats: Chat[], managerNames: string[]): LeadCounts {
    const shiftChats = chats.filter((chat) => this.isShiftChat(chat, managerNames));
    const leads = shiftChats.filter((chat) => LEAD_STATUSES.has(chat.status));
    const target = leads.filter((chat) => TARGET_STATUSES.has(chat.status));
    return {
      leads: leads.length,
      target: target.length,
      facebook: leads.filter((chat) => chat.status === FACEBOOK_STATUS).length,
      newBot: leads.filter((chat) => chat.status === NEW_BOT_STATUS).length,
      bySource: this.groupBySource(leads, target),
    };
  }

  /** Counts the separate whole-day statuses of the service manager. */
  countServiceLeads(chats: Chat[]): ServiceCounts {
    const own = chats.filter((chat) => chat.assignedManagerName === SERVICE_MANAGER_NAME);
    const countStatus = (status: string): number => own.filter((chat) => chat.status === status).length;
    return {
      liveStream: countStatus(LIVE_STREAM_STATUS),
      returns: countStatus(RETURNS_STATUS),
      serviceRequests: countStatus(SERVICE_REQUEST_STATUS),
    };
  }

  private isShiftChat(chat: Chat, managerNames: string[]): boolean {
    if (!chat.assignedManagerName) return true;
    return managerNames.includes(chat.assignedManagerName);
  }

  private groupBySource(leads: Chat[], target: Chat[]): SourceCount[] {
    const targetCounts = this.countBySource(target);
    return [...this.countBySource(leads)]
      .map(([source, count]) => ({ source, leads: count, target: targetCounts.get(source) ?? 0 }))
      .sort((first, second) => second.leads - first.leads);
  }

  private countBySource(chats: Chat[]): Map<string, number> {
    const counts = new Map<string, number>();
    for (const chat of chats) {
      const source = findSourceLabel(chat);
      counts.set(source, (counts.get(source) ?? 0) + 1);
    }
    return counts;
  }
}

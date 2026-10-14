import { Injectable } from '@nestjs/common';

import type { Chat } from '@/types/Chat';
import type { OrderInfo } from '@/types/OrderInfo';
import type { TimeRange } from '@/types/TimeRange';

import { waitMillis } from '@/common/waitMillis';
import { AppConfigService } from '@/config/AppConfigService';
import { parseChatPage } from '@/sitniks/parseChatPage';
import { parseOrderPage } from '@/sitniks/parseOrderPage';
import {
  CHAT_PAGE_PAUSE_MS,
  CHAT_PAGE_SIZE,
  ORDER_PAGE_PAUSE_MS,
  ORDER_PAGE_SIZE,
  RATE_LIMIT_MAX_RETRIES,
  RATE_LIMIT_WAIT_MS,
} from '@/sitniks/sitniksLimits';

@Injectable()
export class SitniksService {
  constructor(private readonly appConfig: AppConfigService) {}

  /** Fetches every chat whose last message falls into the range, page by page within the API rate limit. */
  async fetchChats(range: TimeRange): Promise<Chat[]> {
    const chats: Chat[] = [];
    for (let skip = 0; ; skip += CHAT_PAGE_SIZE) {
      const query = `limit=${CHAT_PAGE_SIZE}&skip=${skip}&startDate=${range.from}&endDate=${range.to}`;
      const page = parseChatPage(await this.getJson({ path: `/chats?${query}`, attempt: 0 }));
      chats.push(...page);
      if (page.length < CHAT_PAGE_SIZE) return chats;
      await waitMillis(CHAT_PAGE_PAUSE_MS);
    }
  }

  /** Looks up orders by their internal Sitniks ids; ids that do not exist are simply absent from the result. */
  async fetchOrders(orderIds: number[]): Promise<OrderInfo[]> {
    const found: OrderInfo[] = [];
    for (let start = 0; start < orderIds.length; start += ORDER_PAGE_SIZE) {
      const ids = orderIds.slice(start, start + ORDER_PAGE_SIZE).join(',');
      found.push(...parseOrderPage(await this.getJson({ path: `/orders?limit=${ORDER_PAGE_SIZE}&orderIds=${ids}`, attempt: 0 })));
      await waitMillis(ORDER_PAGE_PAUSE_MS);
    }
    return found;
  }

  private async getJson(request: { path: string; attempt: number }): Promise<unknown> {
    const { sitniksApiUrl, sitniksApiKey } = this.appConfig.config;
    const response = await fetch(`${sitniksApiUrl}/open-api${request.path}`, {
      headers: { Authorization: `Bearer ${sitniksApiKey}` },
    });
    if (response.status === 429 && request.attempt < RATE_LIMIT_MAX_RETRIES) {
      await waitMillis(RATE_LIMIT_WAIT_MS);
      return this.getJson({ ...request, attempt: request.attempt + 1 });
    }
    if (!response.ok) throw new Error(`Sitniks request ${request.path.split('?')[0]} failed with HTTP ${response.status}`);
    return response.json();
  }
}

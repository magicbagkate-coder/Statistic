import { Injectable } from '@nestjs/common';

import type { OrderBatch } from '@/types/OrderBatch';
import type { ShiftReport } from '@/types/ShiftReport';

import { batchOrderIds } from '@/orders/batchOrderIds';
import { buildShiftReport } from '@/report/buildShiftReport';
import { SitniksService } from '@/sitniks/SitniksService';
import { SnapshotStore } from '@/snapshots/SnapshotStore';

/** How long a finished list may wait for the lead snapshot of its shift before the report is given up. */
export const SNAPSHOT_WAIT_LIMIT_MS = 3 * 60 * 60 * 1000;

@Injectable()
export class ReportService {
  constructor(
    private readonly sitniks: SitniksService,
    private readonly snapshots: SnapshotStore,
  ) {}

  /**
   * Joins the lead snapshot of the shift with the orders listed in Telegram.
   * Returns undefined while the snapshot has not been taken yet (the list came before the shift window closed).
   */
  async prepareReport(request: { batch: OrderBatch; now: number }): Promise<ShiftReport | undefined> {
    const { batch, now } = request;
    const leads = await this.snapshots.load(batch.date, batch.shift);
    if (!leads && now - batch.lastMessageAt < SNAPSHOT_WAIT_LIMIT_MS) return undefined;
    if (!leads) throw new Error(`No lead snapshot for ${batch.date}, shift ${batch.shift}`);
    const orders = await this.sitniks.fetchOrders(batchOrderIds(batch));
    return buildShiftReport({ batch, leads, orders });
  }
}

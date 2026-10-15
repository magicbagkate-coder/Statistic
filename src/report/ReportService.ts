import { Injectable } from '@nestjs/common';

import type { OrderBatch } from '@/types/OrderBatch';
import type { ShiftReport } from '@/types/ShiftReport';

import { batchOrderIds } from '@/orders/batchOrderIds';
import { buildShiftReport } from '@/report/buildShiftReport';
import { SitniksService } from '@/sitniks/SitniksService';
import { SnapshotStore } from '@/snapshots/SnapshotStore';

@Injectable()
export class ReportService {
  constructor(
    private readonly sitniks: SitniksService,
    private readonly snapshots: SnapshotStore,
  ) {}

  /** Joins the lead snapshot of the shift with the orders listed in Telegram. */
  async prepareReport(batch: OrderBatch): Promise<ShiftReport> {
    const leads = await this.snapshots.load(batch.date, batch.shift);
    if (!leads) throw new Error(`No lead snapshot for ${batch.date}, shift ${batch.shift}`);
    const orders = await this.sitniks.fetchOrders(batchOrderIds(batch));
    return buildShiftReport({ batch, leads, orders });
  }
}

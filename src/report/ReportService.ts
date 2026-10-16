import { Injectable } from '@nestjs/common';

import type { DayReport } from '@/types/DayReport';
import type { LiveOrders } from '@/types/LiveOrders';
import type { OrderBatch } from '@/types/OrderBatch';
import type { ShiftReport } from '@/types/ShiftReport';

import { batchOrderIds } from '@/orders/batchOrderIds';
import { buildDayReport } from '@/report/buildDayReport';
import { buildShiftReport } from '@/report/buildShiftReport';
import { computePlan } from '@/report/computePlan';
import { SitniksService } from '@/sitniks/SitniksService';
import { SnapshotStore } from '@/snapshots/SnapshotStore';
import { ReportStore } from '@/storage/ReportStore';

/** How long a finished message may wait for what its report needs before the report is given up. */
export const SNAPSHOT_WAIT_LIMIT_MS = 3 * 60 * 60 * 1000;

@Injectable()
export class ReportService {
  constructor(
    private readonly sitniks: SitniksService,
    private readonly snapshots: SnapshotStore,
    private readonly reportStore: ReportStore,
  ) {}

  /**
   * Joins the lead snapshot of the shift with the orders listed in Telegram; the plan follows from the shift's target leads.
   * Returns undefined while the snapshot has not been taken yet (the list came before the shift window closed).
   */
  async prepareReport(request: { batch: OrderBatch; now: number }): Promise<ShiftReport | undefined> {
    const { batch, now } = request;
    const leads = await this.snapshots.load(batch.date, batch.shift);
    if (!leads && now - batch.lastMessageAt < SNAPSHOT_WAIT_LIMIT_MS) return undefined;
    if (!leads) throw new Error(`No lead snapshot for ${batch.date}, shift ${batch.shift}`);
    const orders = await this.sitniks.fetchOrders(batchOrderIds(batch));
    return buildShiftReport({ batch, leads, orders, plan: computePlan(leads.target) });
  }

  /**
   * Builds the whole-day report once the day snapshot and both shift reports exist (the orders are their sum);
   * the plan follows from the day's target leads. Returns undefined while something is still missing;
   * after a long wait it names what is missing.
   */
  async prepareDayReport(request: { entry: LiveOrders; now: number }): Promise<DayReport | undefined> {
    const { entry, now } = request;
    const counts = await this.snapshots.loadDay(entry.date);
    const shiftReports = await this.loadShiftReports(entry.date);
    if (counts && shiftReports.length === 2) {
      return buildDayReport({ entry, counts, shiftReports, plan: computePlan(counts.day.target) });
    }
    if (now - entry.lastMessageAt < SNAPSHOT_WAIT_LIMIT_MS) return undefined;
    throw new Error(`Cannot build the day report for ${entry.date}: ${counts ? '' : 'no day snapshot, '}${shiftReports.length} of 2 shift reports`);
  }

  private async loadShiftReports(date: string): Promise<ShiftReport[]> {
    const stored = await Promise.all([this.reportStore.load(date, 1), this.reportStore.load(date, 2)]);
    return stored.flatMap((item) => (item ? [item.report] : []));
  }
}

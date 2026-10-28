import { Injectable } from '@nestjs/common';

import type { DayReport } from '@/types/DayReport';
import type { LiveOrders } from '@/types/LiveOrders';
import type { OrderBatch } from '@/types/OrderBatch';
import type { ShiftReport } from '@/types/ShiftReport';

import { kyivDayAfter, kyivLocalToIso } from '@/common/kyivTime';
import { batchOrderIds } from '@/orders/batchOrderIds';
import { buildDayReport } from '@/report/buildDayReport';
import { buildShiftReport } from '@/report/buildShiftReport';
import { computeDayPlan } from '@/report/computeDayPlan';
import { computePlan } from '@/report/computePlan';
import { SitniksService } from '@/sitniks/SitniksService';
import { SnapshotStore } from '@/snapshots/SnapshotStore';
import { ReportStore } from '@/storage/ReportStore';

/** Kyiv time of the next day after which the day report goes out even without the live stream count (then zero orders). */
export const DAY_REPORT_DEADLINE = '02:00:00';

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
   * the plan is the sum of the two shifts' plans. Returns undefined while something is still missing;
   * after a long wait it names what is missing.
   */
  async prepareDayReport(request: { entry: LiveOrders; now: number }): Promise<DayReport | undefined> {
    const { entry, now } = request;
    const counts = await this.snapshots.loadDay(entry.date);
    const shiftReports = await this.loadShiftReports(entry.date);
    if (counts && shiftReports.length === 2) {
      return buildDayReport({ entry, counts, shiftReports, plan: computeDayPlan({ shiftReports, target: counts.day.target }) });
    }
    if (now - entry.lastMessageAt < SNAPSHOT_WAIT_LIMIT_MS) return undefined;
    throw new Error(`Cannot build the day report for ${entry.date}: ${counts ? '' : 'no day snapshot, '}${shiftReports.length} of 2 shift reports`);
  }

  /**
   * The whole-day numbers for the table, which does not wait for the service manager: ready as soon as the day snapshot
   * and both shift reports exist, with zero live stream orders. Undefined once the day report has been sent: it wrote
   * the row with the real live stream orders, and this version must not overwrite it.
   */
  async prepareDayTableReport(date: string): Promise<DayReport | undefined> {
    if (await this.reportStore.existsDay(date)) return undefined;
    const counts = await this.snapshots.loadDay(date);
    const shiftReports = await this.loadShiftReports(date);
    if (!counts || shiftReports.length < 2) return undefined;
    const entry = { date, count: 0, messageId: 0, lastMessageAt: 0 };
    return buildDayReport({ entry, counts, shiftReports, plan: computeDayPlan({ shiftReports, target: counts.day.target }) });
  }

  /**
   * The day report with zero live stream orders, for when the service manager wrote nothing by the deadline.
   * Undefined before the deadline, when the report was already sent, or while its numbers are not ready.
   */
  async prepareDefaultDayReport(request: { date: string; now: number }): Promise<DayReport | undefined> {
    const { date, now } = request;
    const deadline = Date.parse(kyivLocalToIso(kyivDayAfter(date), DAY_REPORT_DEADLINE));
    if (now < deadline || (await this.reportStore.existsDay(date))) return undefined;
    return this.prepareDayTableReport(date);
  }

  private async loadShiftReports(date: string): Promise<ShiftReport[]> {
    const stored = await Promise.all([this.reportStore.load(date, 1), this.reportStore.load(date, 2)]);
    return stored.flatMap((item) => (item ? [item.report] : []));
  }
}

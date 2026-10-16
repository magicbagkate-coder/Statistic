import type { ReportRow } from '@/types/ReportRow';
import type { SourceBlock } from '@/types/SourceBlock';

import { SOURCE_BLOCKS } from '@/sheets/sheetLayout';

type BlockTotals = { leads: number; target: number; orders: number };

/** A fraction for a percent-formatted cell; an empty cell when there is nothing to divide by. */
function ratio(orders: number, base: number): number | string {
  return base === 0 ? '' : orders / base;
}

function sumBlock(rows: ReportRow[], block: SourceBlock): BlockTotals {
  const own = rows.filter((row) => block.labels.includes(row.source));
  return {
    leads: own.reduce((sum, row) => sum + row.leads, 0),
    target: own.reduce((sum, row) => sum + row.target, 0),
    orders: own.reduce((sum, row) => sum + row.orders, 0),
  };
}

function blockCells(block: SourceBlock, totals: BlockTotals): (string | number)[] {
  if (block.withTarget) {
    return [totals.leads, totals.target, totals.orders, ratio(totals.orders, totals.leads), ratio(totals.orders, totals.target)];
  }
  return [totals.leads, totals.orders, ratio(totals.orders, totals.leads)];
}

type Totals = { leads: number; target: number; orders: number };

/** The cells of one table row from the first block to the closing totals (leads, target leads, orders, two conversions). */
export function buildRowValues(request: { rows: ReportRow[]; totals: Totals }): (string | number)[] {
  const cells = SOURCE_BLOCKS.flatMap((block) => blockCells(block, sumBlock(request.rows, block)));
  const { leads, target, orders } = request.totals;
  return [...cells, leads, target, orders, ratio(orders, leads), ratio(orders, target)];
}

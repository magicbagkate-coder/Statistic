import type { ReportRow } from '@/types/ReportRow';

import { formatPercent } from '@/report/formatPercent';

export function formatSourceRow(row: ReportRow): string {
  return `${row.source}: ${row.leads} / ${row.target} / ${row.orders} / ${formatPercent(row.conversion)}`;
}

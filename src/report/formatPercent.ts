import { REPORT_TEXTS } from '@/report/reportTexts';

/** Formats a percentage with one decimal and a comma; a missing value (nothing to divide by) becomes a dash. */
export function formatPercent(value: number | undefined): string {
  if (value === undefined) return REPORT_TEXTS.noValue;
  return `${value.toFixed(1).replace('.', ',')}%`;
}

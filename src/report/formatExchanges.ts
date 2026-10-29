import { REPORT_TEXTS } from '@/report/reportTexts';

/** The exchanges line; nothing for day reports made before exchanges were counted. */
export function formatExchanges(count: number | undefined): string[] {
  return count === undefined ? [] : [`${REPORT_TEXTS.exchanges}: ${count}`];
}

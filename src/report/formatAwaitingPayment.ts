import { REPORT_TEXTS } from '@/report/reportTexts';

/** The line with the leads that were sent the payment details and have not paid; nothing for snapshots taken without this count. */
export function formatAwaitingPayment(count: number | undefined): string[] {
  return count === undefined ? [] : [`${REPORT_TEXTS.awaitingPayment}: ${count}`];
}

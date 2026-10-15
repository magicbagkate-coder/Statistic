import { kyivDateAt, kyivDayBefore, kyivHourAt } from '@/common/kyivTime';

/** Messages before this Kyiv hour still belong to the previous working day. */
const NEW_DAY_HOUR = 6;

/** The day a message is about: the date written in it, else the day it was sent (night messages count for the day before). */
export function resolveWorkingDate(writtenDate: string | undefined, sentAt: number): string {
  if (writtenDate) return writtenDate;
  const sentDate = kyivDateAt(sentAt);
  return kyivHourAt(sentAt) < NEW_DAY_HOUR ? kyivDayBefore(sentDate) : sentDate;
}

import type { ShiftNumber } from '@/types/ShiftNumber';
import type { TimeRange } from '@/types/TimeRange';

import { kyivDayAfter, kyivLocalToIso } from '@/common/kyivTime';

const FIRST_SHIFT_START = '00:15:00';
const FIRST_SHIFT_END = '16:15:00';
const SECOND_SHIFT_END = '00:30:00';

/**
 * The time range (Kyiv) in which a chat's last message must fall to count for the shift.
 * The first shift runs from 00:15 to 16:15; the second from 16:15 to 00:30 of the next day,
 * which leaves a little time for managers who finish late.
 */
export function shiftWindow(date: string, shift: ShiftNumber): TimeRange {
  if (shift === 1) return { from: kyivLocalToIso(date, FIRST_SHIFT_START), to: kyivLocalToIso(date, FIRST_SHIFT_END) };
  return { from: kyivLocalToIso(date, FIRST_SHIFT_END), to: kyivLocalToIso(kyivDayAfter(date), SECOND_SHIFT_END) };
}

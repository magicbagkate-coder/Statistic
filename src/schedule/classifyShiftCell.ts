import type { ShiftNumber } from '@/types/ShiftNumber';

const SHIFT_PATTERN = /^(\d{1,2})\s*-\s*(\d{1,2})$/;
const FIRST_SHIFT_END_HOUR = 16;
const SECOND_SHIFT_START_HOUR = 16;
const SECOND_SHIFT_END_HOUR = 24;

/**
 * Maps a schedule cell such as "9 - 16", "17 - 24" or "8 - 24" to the shifts the person works: the whole day (8 - 24)
 * is both shifts, and the person counts in each of them. Other values (day off, vacation) belong to no shift.
 */
export function classifyShiftCell(cell: string): ShiftNumber[] {
  const match = SHIFT_PATTERN.exec(cell.trim());
  if (!match) return [];
  const startHour = Number(match[1]);
  const endHour = Number(match[2]);
  if (endHour === FIRST_SHIFT_END_HOUR) return [1];
  if (endHour !== SECOND_SHIFT_END_HOUR) return [];
  return startHour >= SECOND_SHIFT_START_HOUR ? [2] : [1, 2];
}

import type { ShiftNumber } from '@/types/ShiftNumber';

const SHIFT_PATTERN = /^(\d{1,2})\s*-\s*(\d{1,2})$/;
const FIRST_SHIFT_END_HOUR = 16;
const SECOND_SHIFT_START_HOUR = 16;
const SECOND_SHIFT_END_HOUR = 24;

/** Maps a schedule cell such as "9 - 16" or "17 - 24" to a shift; other values (day off, 8 - 24) belong to no shift. */
export function classifyShiftCell(cell: string): ShiftNumber | undefined {
  const match = SHIFT_PATTERN.exec(cell.trim());
  if (!match) return undefined;
  const startHour = Number(match[1]);
  const endHour = Number(match[2]);
  if (endHour === FIRST_SHIFT_END_HOUR) return 1;
  if (endHour === SECOND_SHIFT_END_HOUR && startHour >= SECOND_SHIFT_START_HOUR) return 2;
  return undefined;
}

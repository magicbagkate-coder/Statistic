import type { ScheduleEntry } from '@/types/ScheduleEntry';

const DAYS_HEADER = 'График роботи';
const FIRST_DAY_COLUMN = 2;

function findHeaderIndex(rows: string[][]): number {
  const index = rows.findIndex((row) => (row[0] ?? '').trim() === DAYS_HEADER);
  if (index < 0) throw new Error(`Schedule header "${DAYS_HEADER}" not found`);
  return index;
}

function findDayColumn(headerRow: string[], day: number): number {
  const column = headerRow.findIndex((cell, index) => index >= FIRST_DAY_COLUMN && Number(cell) === day);
  if (column < 0) throw new Error(`Day ${day} not found in the schedule header`);
  return column;
}

/** Reads one day of a month tab: employee names with the raw shift cell for that day. */
export function readShiftEntries(rows: string[][], day: number): ScheduleEntry[] {
  const headerIndex = findHeaderIndex(rows);
  const column = findDayColumn(rows[headerIndex], day);
  return rows
    .slice(headerIndex + 2)
    .filter((row) => (row[0] ?? '').trim().length > 0)
    .map((row) => ({ name: row[0].trim(), cell: row[column] ?? '' }));
}

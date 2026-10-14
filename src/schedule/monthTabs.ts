export const MANAGERS_TAB = 'managers';

const MONTH_TABS: readonly string[] = [
  'январь',
  'февраль',
  'март',
  'апрель',
  'май',
  'июнь',
  'июль',
  'август',
  'сентябрь',
  'октябрь',
  'ноябрь',
  'декабрь',
];

/** Returns the schedule tab name for a month number from 1 to 12. */
export function monthTabName(month: number): string {
  return MONTH_TABS[month - 1];
}

const MONTH_NAMES: readonly string[] = [
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

/** The month name (Russian, as after "на") for a month number from 1 to 12. */
export function monthName(month: number): string {
  return MONTH_NAMES[month - 1];
}

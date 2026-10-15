import type { ParsedPlan } from '@/types/ParsedPlan';
import type { PlanScope } from '@/types/PlanScope';
import type { PlanValues } from '@/types/PlanValues';

import { readDate } from '@/orders/readDate';

const PLAN_WORD = /план/i;
const SHIFT_SCOPE = /смен[аы]?\s*([12])/i;
const DAY_SCOPE = /день|дня|сутки|итог/i;
const ORDERS_PATTERN = /заказ[а-яё]*\s*[:=\-–—]?\s*(\d{1,4})/i;
const CONVERSION_PATTERN = /конверси[а-яё]*\s*[:=\-–—]?\s*(\d{1,3}(?:[.,]\d+)?)\s*%?/i;
const PERCENT_PATTERN = /\d+(?:[.,]\d+)?\s*%/g;

function scopeOf(line: string): PlanScope | undefined {
  const shift = SHIFT_SCOPE.exec(line);
  if (shift) return shift[1] === '1' ? 'shift1' : 'shift2';
  return DAY_SCOPE.test(line) ? 'day' : undefined;
}

function readValues(line: string): PlanValues | undefined {
  const orders = ORDERS_PATTERN.exec(line);
  const conversion = CONVERSION_PATTERN.exec(line);
  const values: PlanValues = {};
  if (orders) values.orders = Number(orders[1]);
  if (conversion) values.conversion = Number(conversion[1].replace(',', '.'));
  return orders || conversion ? values : undefined;
}

/** A line with "смена 1", "смена 2" or "день" sets the scope for the numbers on it and below it; before any, the scope is the day. */
function collectValues(text: string): Map<PlanScope, PlanValues> {
  const byScope = new Map<PlanScope, PlanValues>();
  let scope: PlanScope = 'day';
  for (const line of text.split('\n')) {
    scope = scopeOf(line) ?? scope;
    const values = readValues(line);
    if (values) byScope.set(scope, { ...byScope.get(scope), ...values });
  }
  return byScope;
}

/** Reads a plan message such as "План 16.10 / Смена 1: заказы 20, конверсия 20% / Смена 2: ... / День: ...". */
export function parsePlanMessage(text: string, fallbackYear: string): ParsedPlan | undefined {
  if (!PLAN_WORD.test(text)) return undefined;
  const byScope = collectValues(text);
  if (byScope.size === 0) return undefined;
  return {
    date: readDate(text.replace(PERCENT_PATTERN, ' '), fallbackYear),
    entries: [...byScope].map(([scope, values]) => ({ scope, values })),
  };
}

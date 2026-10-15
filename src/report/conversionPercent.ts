const PERCENT = 100;

/** Conversion = orders / target leads × 100; undefined when there are no target leads to divide by. */
export function conversionPercent(orders: number, target: number): number | undefined {
  if (target === 0) return undefined;
  return (orders / target) * PERCENT;
}

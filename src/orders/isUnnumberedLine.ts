import { isSourceLine } from '@/orders/findUnnumberedSource';

const MAX_LINE_LENGTH = 80;
const LONG_NUMBER = /\d{3,}/;
const ABSENT = String.raw`(?:нет|нема|немає|отсутств[а-яіїєё]*|відсутн[а-яіїєё]*|без)`;
const WAIT = String.raw`(?:(?:ещё|еще|пока|поки|ще)\s+)?`;
/** "нет номера заказа", "номера заказа нет", "без номера", "номер отсутствует", "немає номера" and the like. */
const NO_NUMBER = new RegExp(String.raw`${ABSENT}\s+${WAIT}номер|номер[а-яіїєё]*(?:\s+заказ[а-яіїєё]*|\s+замовлен[а-яіїєё]*)?\s+${WAIT}${ABSENT}`, 'i');

/**
 * A line that says an order has no number yet: either it says so in words ("номера заказа нет (инста 1)"),
 * or it only names a source ("інстаграм 1"). A line with a long number is a numbered order, not this.
 */
export function isUnnumberedLine(line: string): boolean {
  if (line.length > MAX_LINE_LENGTH || LONG_NUMBER.test(line)) return false;
  return NO_NUMBER.test(line) || isSourceLine(line);
}

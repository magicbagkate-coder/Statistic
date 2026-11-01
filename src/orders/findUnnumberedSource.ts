import { DATE_PATTERN } from '@/orders/readDate';

/** The source name for an order that has no number yet and names no (or an unclear) source. */
export const UNKNOWN_SOURCE = 'Без источника';

const FIRST_ACCOUNT = /(?:^|\D)1(?:\D|$)|перв|один|first|основн/;
const SECOND_ACCOUNT = /(?:^|\D)2(?:\D|$)|втор|два|second/;

const SINGLE_SOURCES: readonly (readonly [RegExp, string])[] = [
  [/телеграм.*(?:тик\s*ток|tiktok)|(?:тик\s*ток|tiktok).*телеграм/, 'Телеграм (Tiktok)'],
  [/тик\s*ток|tiktok/, 'Тикток'],
  [/телеграм|telegram/, 'Телеграмм'],
  [/вайбер|viber/, 'Вайбер'],
  [/сайт|site/, 'сайт'],
];

const TWO_ACCOUNT_SOURCES = [
  { platform: /инст|insta/, first: 'Инста 1', second: 'Инста 2' },
  { platform: /фб|фейсбук|facebook|\bfb\b/, first: 'ФБ 1', second: 'ФБ 2' },
];

function findAccountSource(text: string): string | undefined {
  const rule = TWO_ACCOUNT_SOURCES.find((item) => item.platform.test(text));
  if (!rule) return undefined;
  const isFirst = FIRST_ACCOUNT.test(text);
  const isSecond = SECOND_ACCOUNT.test(text);
  if (isFirst === isSecond) return UNKNOWN_SOURCE;
  return isFirst ? rule.first : rule.second;
}

/** Lower case, with the Ukrainian "і" written as the Russian "и", so "інстаграм" and "инстаграм" are the same word. */
function normalizeSource(text: string): string {
  return text.toLowerCase().replace(/і/g, 'и');
}

/**
 * Maps what a manager wrote in the brackets of "нет номера заказа (...)" to the owner's source name.
 * "Instagram" or "Facebook" without a clear account number is not guessed: it gets the unknown source.
 */
export function findUnnumberedSource(text: string): string {
  const lower = normalizeSource(text);
  const single = SINGLE_SOURCES.find(([pattern]) => pattern.test(lower));
  if (single) return single[1];
  return findAccountSource(lower) ?? UNKNOWN_SOURCE;
}

const SOURCE_LINE_MAX_LENGTH = 30;
const LONG_NUMBER = /\d{3,}/;
const NOT_SOURCE_LINE = new RegExp(`${LONG_NUMBER.source}|${DATE_PATTERN.source}|смен`);
const SOURCE_WORD = /инст|insta|фб|фейсбук|facebook|\bfb\b|телеграм|telegram|тик\s*ток|tiktok|вайбер|viber|сайт|site/;

/**
 * A short line that only names a source ("інстаграм 1", "Вайбер"): an order without a number yet, written without
 * the words "нет номера заказа". Lines with a long number (a numbered order), a date or a shift are not such lines.
 */
export function isSourceLine(line: string): boolean {
  const lower = normalizeSource(line.trim());
  if (lower.length === 0 || lower.length > SOURCE_LINE_MAX_LENGTH) return false;
  return SOURCE_WORD.test(lower) && !NOT_SOURCE_LINE.test(lower);
}

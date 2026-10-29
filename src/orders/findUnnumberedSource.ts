/** The source name for an order that has no number yet and names no (or an unclear) source. */
export const UNKNOWN_SOURCE = 'Без источника';

const FIRST_ACCOUNT = /(?:^|\D)1(?:\D|$)|перв|один|first|основн/;
const SECOND_ACCOUNT = /(?:^|\D)2(?:\D|$)|втор|два|second/;

const SINGLE_SOURCES: readonly (readonly [RegExp, string])[] = [
  [/телеграм.*(?:тикток|tiktok)|(?:тикток|tiktok).*телеграм/, 'Телеграм (Tiktok)'],
  [/тикток|tiktok/, 'Тикток'],
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

/**
 * Maps what a manager wrote in the brackets of "нет номера заказа (...)" to the owner's source name.
 * "Instagram" or "Facebook" without a clear account number is not guessed: it gets the unknown source.
 */
export function findUnnumberedSource(text: string): string {
  const lower = text.toLowerCase();
  const single = SINGLE_SOURCES.find(([pattern]) => pattern.test(lower));
  if (single) return single[1];
  return findAccountSource(lower) ?? UNKNOWN_SOURCE;
}

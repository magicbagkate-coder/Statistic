import type { Chat } from '@/types/Chat';

export const UNKNOWN_SOURCE = 'Другой источник';
export const TIKTOK_SOURCE = 'Тикток';

const SOURCE_LABELS: ReadonlyMap<string, string> = new Map([
  ['1466303086808010', 'Инста 1'],
  ['6060748207346684', 'Инста 2'],
  ['116703606379071', 'ФБ 1'],
  ['2370665953258825', 'ФБ 2'],
  ['6082520698', 'Телеграмм'],
  ['-000QOI6Pr_kmk6ibKlN3l2ZW6_7xyylyIXF', TIKTOK_SOURCE],
  ['8905824266', 'Телеграм (Tiktok)'],
  ['380981756903', 'Вайбер'],
]);

export function findSourceLabel(chat: Chat): string {
  return SOURCE_LABELS.get(chat.ownerId ?? '') ?? UNKNOWN_SOURCE;
}

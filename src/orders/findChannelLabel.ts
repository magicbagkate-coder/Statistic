const CHANNEL_LABELS: ReadonlyMap<string, string> = new Map([
  ['instagram 1 аккаунт', 'Инста 1'],
  ['инстаграм 2 аккаунт', 'Инста 2'],
  ['facebook 1 аккаунт', 'ФБ 1'],
  ['facebook 2 аккаунт', 'ФБ 2'],
  ['телеграм (основной)', 'Телеграмм'],
  ['телеграм (tiktok)', 'Телеграм (Tiktok)'],
  ['tiktok', 'Тикток'],
  ['вайбер', 'Вайбер'],
]);

/** Maps a Sitniks sales channel title to the owner's source name; unknown channels keep their own title. */
export function findChannelLabel(title: string): string {
  return CHANNEL_LABELS.get(title.trim().toLowerCase()) ?? title;
}

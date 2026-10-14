export const FACEBOOK_STATUS = 'Фейсбук';
export const NEW_BOT_STATUS = 'Новий БОТ';
export const LIVE_STREAM_STATUS = 'Прямий ефір';
export const RETURNS_STATUS = 'Повернення';
export const SERVICE_REQUEST_STATUS = 'Сервісне звернення';

export const SERVICE_MANAGER_NAME = 'Аліна Хоніч';

export const TARGET_STATUSES: ReadonlySet<string> = new Set([
  'Новий',
  'Вибір товару',
  'Очікуємо оплату або дані',
  'Очікуємо оплату (нагадування)',
  'Замовлення закордон',
  'Резерв (товар відсутній)',
  'Замовлення створено',
  'Бронь',
]);

export const LEAD_STATUSES: ReadonlySet<string> = new Set([
  ...TARGET_STATUSES,
  FACEBOOK_STATUS,
  NEW_BOT_STATUS,
  'В роботі',
  'Рассылка (напоминание об оплате)',
]);

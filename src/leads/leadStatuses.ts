export const FACEBOOK_STATUS = 'Фейсбук';
export const NEW_BOT_STATUS = 'Новий БОТ';
/** Payment details were sent to the client, the order is not paid yet. */
export const AWAITING_PAYMENT_STATUS = 'Очікуємо оплату або дані';
export const LIVE_STREAM_STATUS = 'Прямий ефір';
export const RETURNS_STATUS = 'Повернення';
export const SERVICE_REQUEST_STATUS = 'Сервісне звернення';

export const SERVICE_MANAGER_NAME = 'Аліна Хоніч';

export const TARGET_STATUSES: ReadonlySet<string> = new Set([
  'Новий',
  'Вибір товару',
  AWAITING_PAYMENT_STATUS,
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

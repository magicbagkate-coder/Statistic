const TEN = 10;
const HUNDRED = 100;
const TEENS_FROM = 11;
const TEENS_TO = 14;

/** The Russian word for orders by the last digit: 1 заказ, 2-4 заказа, 0 and 5-9 заказов. */
const LAST_DIGIT_FORMS: readonly string[] = [
  'заказов',
  'заказ',
  'заказа',
  'заказа',
  'заказа',
  'заказов',
  'заказов',
  'заказов',
  'заказов',
  'заказов',
];

/** The Russian word for orders after a number: 1 заказ, 2 заказа, 5 заказов, 11 заказов, 21 заказ. */
export function pluralOrders(count: number): string {
  const lastTwo = count % HUNDRED;
  if (lastTwo >= TEENS_FROM && lastTwo <= TEENS_TO) return 'заказов';
  return LAST_DIGIT_FORMS[count % TEN];
}

import type { OrderInfo } from '@/types/OrderInfo';

type RawOrder = { id: number; salesChannel?: { title?: string } };

export function parseOrderPage(body: unknown): OrderInfo[] {
  const items = typeof body === 'object' && body !== null ? Reflect.get(body, 'data') : undefined;
  if (!Array.isArray(items)) throw new Error('Sitniks order response has an unexpected shape');
  return (items as RawOrder[]).map((item) => ({ id: item.id, channel: item.salesChannel?.title ?? '' }));
}

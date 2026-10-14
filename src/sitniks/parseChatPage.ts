import type { Chat } from '@/types/Chat';

export function parseChatPage(body: unknown): Chat[] {
  const items = typeof body === 'object' && body !== null ? Reflect.get(body, 'data') : undefined;
  if (!Array.isArray(items)) throw new Error('Sitniks chat response has an unexpected shape');
  return items as Chat[];
}

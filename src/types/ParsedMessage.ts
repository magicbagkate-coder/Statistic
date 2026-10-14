import type { OrderCaption } from '@/types/OrderCaption';

export type ParsedMessage = {
  caption?: OrderCaption;
  orderIds: number[];
};

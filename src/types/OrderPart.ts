export type OrderPart = {
  messageId: number;
  orderIds: number[];
  /** The source of each order the manager listed as "no order number yet" (the client has not given a name). */
  unnumbered?: string[];
};

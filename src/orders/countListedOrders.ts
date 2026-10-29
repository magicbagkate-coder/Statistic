/** How many orders a message (or one of a batch's parts) lists: the numbered ones and those without a number yet. */
export function countListedOrders(listed: { orderIds: number[]; unnumbered?: string[] }): number {
  return listed.orderIds.length + (listed.unnumbered?.length ?? 0);
}

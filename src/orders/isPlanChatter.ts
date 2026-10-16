const PLAN_WORD = /план/i;

/** Plans are now computed by the agent; a message that still talks about a plan is not an order list or a caption. */
export function isPlanChatter(text: string): boolean {
  return PLAN_WORD.test(text);
}

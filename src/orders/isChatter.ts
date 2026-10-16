const CHATTER_PATTERN = /план|%/i;

/**
 * Messages about a plan, and the managers' mid-shift progress updates (leads, percent, orders), are not
 * order lists or captions. Plans are computed by the agent; a percent sign marks a progress update.
 */
export function isChatter(text: string): boolean {
  return CHATTER_PATTERN.test(text);
}

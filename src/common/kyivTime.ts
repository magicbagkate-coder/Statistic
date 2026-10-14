export const KYIV_ZONE = 'Europe/Kyiv';

const DAY_MILLIS = 86_400_000;

const zoneFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: KYIV_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

function zoneOffsetMillis(instant: Date): number {
  const parts = zoneFormatter.formatToParts(instant);
  const read = (type: string): number => Number(parts.find((part) => part.type === type)?.value);
  const localAsUtc = Date.UTC(read('year'), read('month') - 1, read('day'), read('hour'), read('minute'), read('second'));
  return localAsUtc - (instant.getTime() - (instant.getTime() % 1000));
}

/** Converts a Kyiv wall-clock moment (date YYYY-MM-DD, time HH:MM:SS) to a UTC ISO string. */
export function kyivLocalToIso(dateText: string, timeText: string): string {
  const guess = Date.parse(`${dateText}T${timeText}Z`);
  const firstOffset = zoneOffsetMillis(new Date(guess));
  const secondOffset = zoneOffsetMillis(new Date(guess - firstOffset));
  return new Date(guess - secondOffset).toISOString();
}

/** Returns today's date in Kyiv as YYYY-MM-DD. */
export function kyivToday(): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: KYIV_ZONE }).format(new Date());
}

/** Returns yesterday's date in Kyiv as YYYY-MM-DD. */
export function kyivYesterday(): string {
  return new Date(Date.parse(`${kyivToday()}T00:00:00Z`) - DAY_MILLIS).toISOString().slice(0, 10);
}

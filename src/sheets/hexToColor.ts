const HEX_BASE = 16;
const HEX_MAX = 255;

/** Turns #rrggbb into the 0..1 red, green and blue the Sheets API expects. */
export function hexToColor(hex: string): { red: number; green: number; blue: number } {
  const part = (start: number): number => parseInt(hex.slice(start, start + 2), HEX_BASE) / HEX_MAX;
  return { red: part(1), green: part(3), blue: part(5) };
}

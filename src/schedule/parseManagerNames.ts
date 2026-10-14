/** Reads the "managers" tab (schedule name, CRM name) into a lookup; the first row is the header. */
export function parseManagerNames(rows: string[][]): Map<string, string> {
  const pairs = rows
    .slice(1)
    .map(([scheduleName, crmName]) => [(scheduleName ?? '').trim(), (crmName ?? '').trim()] as const)
    .filter(([scheduleName, crmName]) => scheduleName.length > 0 && crmName.length > 0);
  return new Map(pairs);
}

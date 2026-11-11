export type ShiftManagers = {
  /** CRM names of the managers the schedule puts on the shift. */
  names: string[];
  /** What did not match between the schedule and the managers tab; empty when everything matched. */
  problems: string[];
};

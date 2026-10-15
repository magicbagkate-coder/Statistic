import type { DayReport } from '@/types/DayReport';

export type StoredDayReport = {
  report: DayReport;
  text: string;
  messageId: number;
  sentAt: string;
};

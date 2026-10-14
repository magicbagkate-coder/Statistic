import type { ShiftReport } from '@/types/ShiftReport';

export type StoredReport = {
  report: ShiftReport;
  text: string;
  messageId: number;
  sentAt: string;
};

import { access } from 'node:fs/promises';
import { join } from 'node:path';

import { Injectable } from '@nestjs/common';

import type { ShiftNumber } from '@/types/ShiftNumber';
import type { StoredReport } from '@/types/StoredReport';

import { writeJson } from '@/storage/jsonFile';

const REPORT_DIR = 'data/reports';

@Injectable()
export class ReportStore {
  save(stored: StoredReport): Promise<void> {
    return writeJson(this.pathFor(stored.report.date, stored.report.shift), stored);
  }

  async exists(date: string, shift: ShiftNumber): Promise<boolean> {
    try {
      await access(this.pathFor(date, shift));
      return true;
    } catch {
      return false;
    }
  }

  private pathFor(date: string, shift: ShiftNumber): string {
    return join(REPORT_DIR, `${date}-shift${shift}.json`);
  }
}

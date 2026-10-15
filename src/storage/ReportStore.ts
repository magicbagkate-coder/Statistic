import { access } from 'node:fs/promises';
import { join } from 'node:path';

import { Injectable } from '@nestjs/common';

import type { ShiftNumber } from '@/types/ShiftNumber';
import type { StoredDayReport } from '@/types/StoredDayReport';
import type { StoredReport } from '@/types/StoredReport';

import { readJson, writeJson } from '@/storage/jsonFile';

const REPORT_DIR = 'data/reports';

@Injectable()
export class ReportStore {
  save(stored: StoredReport): Promise<void> {
    return writeJson(this.pathFor(stored.report.date, `shift${stored.report.shift}`), stored);
  }

  load(date: string, shift: ShiftNumber): Promise<StoredReport | undefined> {
    return readJson<StoredReport>(this.pathFor(date, `shift${shift}`));
  }

  saveDay(stored: StoredDayReport): Promise<void> {
    return writeJson(this.pathFor(stored.report.date, 'day'), stored);
  }

  existsDay(date: string): Promise<boolean> {
    return this.fileExists(this.pathFor(date, 'day'));
  }

  exists(date: string, shift: ShiftNumber): Promise<boolean> {
    return this.fileExists(this.pathFor(date, `shift${shift}`));
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await access(path);
      return true;
    } catch {
      return false;
    }
  }

  private pathFor(date: string, kind: string): string {
    return join(REPORT_DIR, `${date}-${kind}.json`);
  }
}

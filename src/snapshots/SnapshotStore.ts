import { join } from 'node:path';

import { Injectable } from '@nestjs/common';

import type { DayCounts } from '@/types/DayCounts';
import type { LeadCounts } from '@/types/LeadCounts';
import type { ShiftNumber } from '@/types/ShiftNumber';

import { readJson, writeJson } from '@/storage/jsonFile';

const SNAPSHOT_DIR = 'data/snapshots';

@Injectable()
export class SnapshotStore {
  save(request: { date: string; shift: ShiftNumber; counts: LeadCounts }): Promise<void> {
    return writeJson(this.pathFor(request.date, `shift${request.shift}`), request.counts);
  }

  load(date: string, shift: ShiftNumber): Promise<LeadCounts | undefined> {
    return readJson<LeadCounts>(this.pathFor(date, `shift${shift}`));
  }

  saveDay(request: { date: string; counts: DayCounts }): Promise<void> {
    return writeJson(this.pathFor(request.date, 'day'), request.counts);
  }

  loadDay(date: string): Promise<DayCounts | undefined> {
    return readJson<DayCounts>(this.pathFor(date, 'day'));
  }

  private pathFor(date: string, kind: string): string {
    return join(SNAPSHOT_DIR, `${date}-${kind}.json`);
  }
}

import { join } from 'node:path';

import { Injectable } from '@nestjs/common';

import type { LeadCounts } from '@/types/LeadCounts';
import type { ShiftNumber } from '@/types/ShiftNumber';

import { readJson, writeJson } from '@/storage/jsonFile';

const SNAPSHOT_DIR = 'data/snapshots';

@Injectable()
export class SnapshotStore {
  save(request: { date: string; shift: ShiftNumber; counts: LeadCounts }): Promise<void> {
    return writeJson(this.pathFor(request.date, request.shift), request.counts);
  }

  load(date: string, shift: ShiftNumber): Promise<LeadCounts | undefined> {
    return readJson<LeadCounts>(this.pathFor(date, shift));
  }

  private pathFor(date: string, shift: ShiftNumber): string {
    return join(SNAPSHOT_DIR, `${date}-shift${shift}.json`);
  }
}

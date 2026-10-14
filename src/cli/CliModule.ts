import { Module } from '@nestjs/common';

import { AppConfigService } from '@/config/AppConfigService';
import { LeadsService } from '@/leads/LeadsService';
import { ShiftLeadsService } from '@/leads/ShiftLeadsService';
import { ScheduleService } from '@/schedule/ScheduleService';
import { SitniksService } from '@/sitniks/SitniksService';
import { ShiftSnapshotService } from '@/snapshots/ShiftSnapshotService';
import { SnapshotStore } from '@/snapshots/SnapshotStore';

/** Services for command line tools only: no jobs, so nothing polls Telegram or runs on a timer. */
@Module({
  providers: [AppConfigService, SitniksService, ScheduleService, LeadsService, ShiftLeadsService, SnapshotStore, ShiftSnapshotService],
})
export class CliModule {}

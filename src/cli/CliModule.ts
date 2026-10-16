import { Module } from '@nestjs/common';

import { AppConfigService } from '@/config/AppConfigService';
import { LeadsService } from '@/leads/LeadsService';
import { ShiftLeadsService } from '@/leads/ShiftLeadsService';
import { ScheduleService } from '@/schedule/ScheduleService';
import { SheetsClient } from '@/sheets/SheetsClient';
import { SheetsReportWriter } from '@/sheets/SheetsReportWriter';
import { SitniksService } from '@/sitniks/SitniksService';
import { DaySnapshotService } from '@/snapshots/DaySnapshotService';
import { ShiftSnapshotService } from '@/snapshots/ShiftSnapshotService';
import { SnapshotStore } from '@/snapshots/SnapshotStore';
import { ReportStore } from '@/storage/ReportStore';

/** Services for command line tools only: no jobs, so nothing polls Telegram or runs on a timer. */
@Module({
  providers: [
    AppConfigService,
    SitniksService,
    ScheduleService,
    LeadsService,
    ShiftLeadsService,
    SnapshotStore,
    ShiftSnapshotService,
    DaySnapshotService,
    SheetsClient,
    SheetsReportWriter,
    ReportStore,
  ],
})
export class CliModule {}

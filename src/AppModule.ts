import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { AppConfigService } from '@/config/AppConfigService';
import { DayRowJobs } from '@/jobs/DayRowJobs';
import { IntakeJobs } from '@/jobs/IntakeJobs';
import { ReminderJobs } from '@/jobs/ReminderJobs';
import { SnapshotJobs } from '@/jobs/SnapshotJobs';
import { LeadsService } from '@/leads/LeadsService';
import { ShiftLeadsService } from '@/leads/ShiftLeadsService';
import { OrderIntakeService } from '@/orders/OrderIntakeService';
import { ReminderService } from '@/reminders/ReminderService';
import { ReportDeliveryService } from '@/report/ReportDeliveryService';
import { ReportService } from '@/report/ReportService';
import { ScheduleService } from '@/schedule/ScheduleService';
import { SheetsClient } from '@/sheets/SheetsClient';
import { SheetsReportWriter } from '@/sheets/SheetsReportWriter';
import { SitniksService } from '@/sitniks/SitniksService';
import { DaySnapshotService } from '@/snapshots/DaySnapshotService';
import { ShiftSnapshotService } from '@/snapshots/ShiftSnapshotService';
import { SnapshotStore } from '@/snapshots/SnapshotStore';
import { MessageLogStore } from '@/storage/MessageLogStore';
import { DayRowStore } from '@/storage/DayRowStore';
import { ReportStore } from '@/storage/ReportStore';
import { StateStore } from '@/storage/StateStore';
import { TelegramService } from '@/telegram/TelegramService';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [
    AppConfigService,
    SitniksService,
    ScheduleService,
    LeadsService,
    ShiftLeadsService,
    SnapshotStore,
    ShiftSnapshotService,
    DaySnapshotService,
    TelegramService,
    StateStore,
    MessageLogStore,
    ReportStore,
    OrderIntakeService,
    ReportService,
    ReportDeliveryService,
    ReminderService,
    SheetsClient,
    SheetsReportWriter,
    DayRowStore,
    IntakeJobs,
    DayRowJobs,
    SnapshotJobs,
    ReminderJobs,
  ],
})
export class AppModule {}

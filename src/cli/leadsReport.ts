import 'dotenv/config';
import 'reflect-metadata';
import { argv, stdout } from 'node:process';
import { parseArgs } from 'node:util';

import { NestFactory } from '@nestjs/core';

import type { INestApplicationContext } from '@nestjs/common';
import type { LeadCounts } from '@/types/LeadCounts';
import type { ServiceCounts } from '@/types/ServiceCounts';
import type { ShiftNumber } from '@/types/ShiftNumber';

import { CliModule } from '@/cli/CliModule';
import { kyivToday } from '@/common/kyivTime';
import { DaySnapshotService } from '@/snapshots/DaySnapshotService';
import { ShiftSnapshotService } from '@/snapshots/ShiftSnapshotService';

function readShift(text: string): ShiftNumber {
  if (text === '1') return 1;
  if (text === '2') return 2;
  throw new Error('Use --shift 1, --shift 2 or --day');
}

function printCounts(label: string, counts: LeadCounts): void {
  stdout.write(`${label}\n`);
  stdout.write(`leads ${counts.leads} | target ${counts.target} | facebook ${counts.facebook} | new bot ${counts.newBot}\n`);
  for (const row of counts.bySource) stdout.write(`  ${row.source}: leads ${row.leads}, target ${row.target}\n`);
}

function printService(counts: ServiceCounts): void {
  stdout.write(`service manager: live stream ${counts.liveStream} | returns ${counts.returns} | service requests ${counts.serviceRequests} | tiktok ${counts.tiktok ?? 0}\n`);
}

async function printDayReport(app: INestApplicationContext, request: { date: string; save: boolean }): Promise<void> {
  const { date, save } = request;
  const counts = await app.get(DaySnapshotService).collectDay({ date, save });
  printCounts(`whole day, ${date}, no managers chosen${save ? ' (saved)' : ''}`, counts.day);
  printService(counts.service);
}

async function printShiftReport(app: INestApplicationContext, request: { date: string; shiftText: string; save: boolean }): Promise<void> {
  const { date, shiftText, save } = request;
  const shift = readShift(shiftText);
  const counts = await app.get(ShiftSnapshotService).collectShift({ date, shift, save });
  printCounts(`shift ${shift}, ${date}${save ? ' (saved)' : ''}`, counts);
}

async function runReport(): Promise<void> {
  const { values } = parseArgs({
    args: argv.slice(2),
    options: { date: { type: 'string' }, shift: { type: 'string' }, day: { type: 'boolean' }, save: { type: 'boolean' } },
  });
  const date = values.date ?? kyivToday();
  const save = Boolean(values.save);
  const app = await NestFactory.createApplicationContext(CliModule, { logger: ['error'] });
  if (values.day) await printDayReport(app, { date, save });
  if (!values.day) await printShiftReport(app, { date, shiftText: values.shift ?? '', save });
  await app.close();
}

void runReport();

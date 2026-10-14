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
import { LeadsService } from '@/leads/LeadsService';
import { ShiftLeadsService } from '@/leads/ShiftLeadsService';
import { ShiftSnapshotService } from '@/snapshots/ShiftSnapshotService';

function readShift(text: string): ShiftNumber {
  if (text === '1') return 1;
  if (text === '2') return 2;
  throw new Error('Use --shift 1, --shift 2 or --service');
}

function printCounts(label: string, counts: LeadCounts): void {
  stdout.write(`${label}\n`);
  stdout.write(`leads ${counts.leads} | target ${counts.target} | facebook ${counts.facebook} | new bot ${counts.newBot}\n`);
  for (const row of counts.bySource) stdout.write(`  ${row.source}: leads ${row.leads}, target ${row.target}\n`);
}

function printService(label: string, counts: ServiceCounts): void {
  stdout.write(`${label}\n`);
  stdout.write(`live stream ${counts.liveStream} | returns ${counts.returns} | service requests ${counts.serviceRequests}\n`);
}

async function printServiceReport(app: INestApplicationContext, date: string): Promise<void> {
  const chats = await app.get(ShiftLeadsService).fetchDayChats(date);
  printService(`service manager, whole day ${date}`, app.get(LeadsService).countServiceLeads(chats));
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
    options: { date: { type: 'string' }, shift: { type: 'string' }, service: { type: 'boolean' }, save: { type: 'boolean' } },
  });
  const date = values.date ?? kyivToday();
  const app = await NestFactory.createApplicationContext(CliModule, { logger: ['error'] });
  if (values.service) await printServiceReport(app, date);
  if (!values.service) await printShiftReport(app, { date, shiftText: values.shift ?? '', save: Boolean(values.save) });
  await app.close();
}

void runReport();

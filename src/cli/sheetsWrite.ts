import 'dotenv/config';
import 'reflect-metadata';
import { argv, stdout } from 'node:process';
import { parseArgs } from 'node:util';

import { NestFactory } from '@nestjs/core';

import { CliModule } from '@/cli/CliModule';
import { kyivYesterday } from '@/common/kyivTime';
import { SheetsReportWriter } from '@/sheets/SheetsReportWriter';
import { ReportStore } from '@/storage/ReportStore';

async function writeIfPresent<Item>(item: Item | undefined, write: (present: Item) => Promise<void>): Promise<string> {
  if (!item) return 'missing';
  await write(item);
  return 'written';
}

/** Writes the already saved reports of a date (default: yesterday) into the table: shift 1, shift 2 and the day. */
async function writeSavedReports(): Promise<void> {
  const { values } = parseArgs({ args: argv.slice(2), options: { date: { type: 'string' }, reset: { type: 'boolean' } } });
  const date = values.date ?? kyivYesterday();
  const app = await NestFactory.createApplicationContext(CliModule, { logger: ['error'] });
  const store = app.get(ReportStore);
  const writer = app.get(SheetsReportWriter);
  if (values.reset) await writer.reset();
  const first = await writeIfPresent(await store.load(date, 1), (stored) => writer.writeShift(stored.report));
  const second = await writeIfPresent(await store.load(date, 2), (stored) => writer.writeShift(stored.report));
  const day = await writeIfPresent(await store.loadDay(date), (stored) => writer.writeDay(stored.report));
  stdout.write(`${date}: shift 1 ${first}, shift 2 ${second}, day ${day}\n`);
  await app.close();
}

void writeSavedReports();

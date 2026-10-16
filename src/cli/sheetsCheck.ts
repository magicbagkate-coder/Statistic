import 'dotenv/config';
import 'reflect-metadata';
import { stdout } from 'node:process';

import { NestFactory } from '@nestjs/core';

import { CliModule } from '@/cli/CliModule';
import { SheetsClient } from '@/sheets/SheetsClient';

async function checkSheets(): Promise<void> {
  const app = await NestFactory.createApplicationContext(CliModule, { logger: ['error'] });
  const info = await app.get(SheetsClient).describeSpreadsheet();
  stdout.write(`spreadsheet: ${info.title}\nsheets: ${info.sheets.join(' | ') || '(none)'}\n`);
  await app.close();
}

void checkSheets();

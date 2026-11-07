import { Injectable } from '@nestjs/common';

import type { ShiftNumber } from '@/types/ShiftNumber';

import { AppConfigService } from '@/config/AppConfigService';
import { classifyShiftCell } from '@/schedule/classifyShiftCell';
import { fetchSheetRows } from '@/schedule/fetchSheetRows';
import { MANAGERS_TAB, monthTabName } from '@/schedule/monthTabs';
import { parseManagerNames } from '@/schedule/parseManagerNames';
import { readShiftEntries } from '@/schedule/readShiftEntries';

const SERVICE_MANAGER_NAME = /сервис|сервіс/i;

@Injectable()
export class ScheduleService {
  constructor(private readonly appConfig: AppConfigService) {}

  /** Returns the CRM names of managers working the shift on the date (YYYY-MM-DD), each name once. The service manager works apart from the shifts. */
  async findShiftManagers(request: { date: string; shift: ShiftNumber }): Promise<string[]> {
    const spreadsheetId = this.appConfig.config.scheduleSpreadsheetId;
    const month = Number(request.date.slice(5, 7));
    const day = Number(request.date.slice(8, 10));
    const monthRows = await fetchSheetRows({ spreadsheetId, tab: monthTabName(month) });
    const crmNames = parseManagerNames(await fetchSheetRows({ spreadsheetId, tab: MANAGERS_TAB }));
    const scheduled = readShiftEntries(monthRows, day).filter((entry) => !SERVICE_MANAGER_NAME.test(entry.name) && classifyShiftCell(entry.cell).includes(request.shift));
    const missing = scheduled.filter((entry) => !crmNames.has(entry.name)).map((entry) => entry.name);
    if (missing.length > 0) throw new Error(`No CRM name in the managers tab for: ${missing.join(', ')}`);
    return [...new Set(scheduled.map((entry) => crmNames.get(entry.name) as string))];
  }
}

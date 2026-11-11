import { Injectable } from '@nestjs/common';

import type { ShiftManagers } from '@/types/ShiftManagers';
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

  /**
   * Returns the CRM names of managers working the shift on the date (YYYY-MM-DD), each name once. The service manager works apart from the shifts.
   * Names the managers tab does not know are reported as a problem instead of stopping the count.
   */
  async findShiftManagers(request: { date: string; shift: ShiftNumber }): Promise<ShiftManagers> {
    const spreadsheetId = this.appConfig.config.scheduleSpreadsheetId;
    const month = Number(request.date.slice(5, 7));
    const day = Number(request.date.slice(8, 10));
    const monthRows = await fetchSheetRows({ spreadsheetId, tab: monthTabName(month) });
    const crmNames = parseManagerNames(await fetchSheetRows({ spreadsheetId, tab: MANAGERS_TAB }));
    const scheduled = readShiftEntries(monthRows, day).filter((entry) => !SERVICE_MANAGER_NAME.test(entry.name) && classifyShiftCell(entry.cell).includes(request.shift));
    const known = scheduled.filter((entry) => crmNames.has(entry.name));
    const missing = scheduled.filter((entry) => !crmNames.has(entry.name)).map((entry) => entry.name);
    return {
      names: [...new Set(known.map((entry) => crmNames.get(entry.name) as string))],
      problems: missing.length > 0 ? [`нет во вкладке managers: ${missing.join(', ')}`] : [],
    };
  }
}

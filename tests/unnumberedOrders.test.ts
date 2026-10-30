import { describe, expect, it } from 'vitest';

import type { AgentState } from '@/types/AgentState';
import type { LeadCounts } from '@/types/LeadCounts';

import { applyMessage } from '@/orders/applyMessage';
import { batchUnnumbered } from '@/orders/batchUnnumbered';
import { findUnnumberedSource } from '@/orders/findUnnumberedSource';
import { QUIET_PERIOD_MS, splitReadyBatches } from '@/orders/splitReadyBatches';
import { buildShiftReport } from '@/report/buildShiftReport';

const EMPTY: AgentState = { offset: 0, batches: [], liveOrders: [], exchanges: [], tiktok: [], reminders: [] };
const CAPTION = { date: '2026-10-23', shift: 1 as const, leader: 'Наташа' };
const LEADS: LeadCounts = { leads: 100, target: 40, facebook: 0, newBot: 0, bySource: [{ source: 'Инста 1', leads: 60, target: 25 }] };

describe('findUnnumberedSource', () => {
  it('reads the first Instagram account in Russian and English, written in any of the usual ways', () => {
    const phrases = ['первый аккаунт Инстаграма', 'первый аккаунт инстаграм', 'инста 1', 'Инста один', 'Инстаграм 1', '1 аккаунт инстаграм', 'first account instagram', 'instagram 1'];
    expect(phrases.map(findUnnumberedSource)).toEqual(phrases.map(() => 'Инста 1'));
  });

  it('tells the second Instagram account and the two Facebook accounts apart', () => {
    expect(findUnnumberedSource('второй аккаунт инстаграм')).toBe('Инста 2');
    expect(findUnnumberedSource('инста 2')).toBe('Инста 2');
    expect(findUnnumberedSource('ФБ 1')).toBe('ФБ 1');
    expect(findUnnumberedSource('facebook, второй аккаунт')).toBe('ФБ 2');
  });

  it('maps the single account sources', () => {
    expect(findUnnumberedSource('Телеграм')).toBe('Телеграмм');
    expect(findUnnumberedSource('ТикТок')).toBe('Тикток');
    expect(findUnnumberedSource('телеграм тикток')).toBe('Телеграм (Tiktok)');
    expect(findUnnumberedSource('Вайбер')).toBe('Вайбер');
  });

  it('does not guess when the account is unclear or the source is unknown', () => {
    expect(findUnnumberedSource('инстаграм')).toBe('Без источника');
    expect(findUnnumberedSource('')).toBe('Без источника');
    expect(findUnnumberedSource('не знаю')).toBe('Без источника');
  });
});

describe('orders without a number', () => {
  const part = { caption: CAPTION, orderIds: [8800456], unnumbered: ['Инста 1', 'ФБ 2'] };

  it('count as orders of the named source in the shift report, on top of the numbered ones', () => {
    const state = applyMessage(EMPTY, part, { messageId: 1, sentAt: 1000, edited: false });
    const orders = [{ id: 8800456, channel: 'instagram 1 аккаунт' }];
    const report = buildShiftReport({ batch: state.batches[0], leads: LEADS, orders });
    expect(report.orders).toBe(3);
    expect(report.rows.find((row) => row.source === 'Инста 1')?.orders).toBe(2);
    expect(report.rows.find((row) => row.source === 'ФБ 2')?.orders).toBe(1);
    expect(report.missingOrders).toEqual([]);
  });

  it('are replaced, not added again, when the message is edited', () => {
    const first = applyMessage(EMPTY, part, { messageId: 1, sentAt: 1000, edited: false });
    const edited = applyMessage(first, { ...part, unnumbered: ['Инста 1'] }, { messageId: 1, sentAt: 2000, edited: true });
    expect(batchUnnumbered(edited.batches[0])).toEqual(['Инста 1']);
  });

  it('make a batch ready on their own, and a following message with only such lines joins the batch', () => {
    const opened = applyMessage(EMPTY, { caption: CAPTION, orderIds: [], unnumbered: ['Инста 1'] }, { messageId: 1, sentAt: 1000, edited: false });
    const joined = applyMessage(opened, { orderIds: [], unnumbered: ['ФБ 1'] }, { messageId: 2, sentAt: 2000, edited: false });
    expect(batchUnnumbered(joined.batches[0])).toEqual(['Инста 1', 'ФБ 1']);
    expect(splitReadyBatches(joined.batches, 2000 + QUIET_PERIOD_MS).ready).toHaveLength(1);
  });
});

import type { SourceBlock } from '@/types/SourceBlock';

/**
 * The blocks of the table, left to right. A block with target leads has five columns
 * (all leads, target leads, orders, conversion over all leads, conversion over target leads); the others have three.
 * Reports show some sources separately that the table keeps in one block (TikTok and Telegram TikTok).
 */
export const SOURCE_BLOCKS: readonly SourceBlock[] = [
  { key: 'insta1', title: 'Instagram 1 (основной)', labels: ['Инста 1'], withTarget: true, color: '#f4cccc' },
  { key: 'fb1', title: 'FB 1 (основной)', labels: ['ФБ 1'], withTarget: true, color: '#cfe2f3' },
  { key: 'tiktok', title: 'TikTok', labels: ['Тикток', 'Телеграм (Tiktok)'], withTarget: true, color: '#fff2cc' },
  { key: 'insta2', title: 'Instagram 2', labels: ['Инста 2'], withTarget: true, color: '#f4cccc' },
  { key: 'fb2', title: 'FB 2', labels: ['ФБ 2'], withTarget: true, color: '#cfe2f3' },
  { key: 'telegram', title: 'Telegram', labels: ['Телеграмм'], withTarget: false, color: '#d9ead3' },
  { key: 'viber', title: 'Viber', labels: ['Вайбер'], withTarget: false, color: '#d9d2e9' },
];

/** The rows of one date, top to bottom: shift 1, shift 2 and the whole day. */
export const GROUP_LABELS: readonly string[] = ['1', '2', 'День'];

export const DAY_LABEL = 'День';
export const FIRST_BLOCK_COLUMN = 2;
export const HEADER_ROWS = 2;
export const DATA_FIRST_ROW = 3;
export const GRID_ROWS = 1000;
/**
 * The closing columns: the live stream leads and orders and the exchange orders (filled in the day row only) and the totals
 * of the Telegram report: all leads, target leads, orders (the live stream and exchange orders are included) and the two conversions.
 */
export const TOTAL_HEADERS: readonly string[] = [
  'Прямой эфир (лиды)',
  'Прямой эфир (заказы)',
  'Обмены',
  'Всего лидов (общих)',
  'Всего лидов (целевых)',
  'Всего продано',
  'Конверсия общая',
  'Конверсия целевая',
];

/** Offsets, from the first closing column, of the two conversion columns. */
export const TOTAL_PERCENT_OFFSETS: readonly number[] = [6, 7];

export const LABEL_FONT_SIZE = 12;
export const DAY_ROW_COLOR = '#d9ead3';
export const ORDERS_COLOR = '#ffff00';

const WIDTH_WITH_TARGET = 5;
const WIDTH_WITHOUT_TARGET = 3;

export function blockWidth(block: SourceBlock): number {
  return block.withTarget ? WIDTH_WITH_TARGET : WIDTH_WITHOUT_TARGET;
}

/** Zero-based column index where each block starts. */
export function blockStarts(): number[] {
  const starts: number[] = [];
  let column = FIRST_BLOCK_COLUMN;
  for (const block of SOURCE_BLOCKS) {
    starts.push(column);
    column += blockWidth(block);
  }
  return starts;
}

/** Zero-based index of the first of the closing total columns. */
export function totalColumn(): number {
  return FIRST_BLOCK_COLUMN + SOURCE_BLOCKS.reduce((sum, block) => sum + blockWidth(block), 0);
}

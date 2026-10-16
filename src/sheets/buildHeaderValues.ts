import { blockWidth, SOURCE_BLOCKS, TOTAL_HEADERS } from '@/sheets/sheetLayout';

const WITH_TARGET_HEADERS = ['Общие', 'Целевые', 'Заказы', 'Конверсия общ.', 'Конверсия целевая'];
const WITHOUT_TARGET_HEADERS = ['Общие', 'Заказы', 'Конверсия'];

/** The two header rows: the block titles (first cell of each block) and the column names. */
export function buildHeaderValues(): string[][] {
  const titles = SOURCE_BLOCKS.flatMap((block) => [block.title, ...Array<string>(blockWidth(block) - 1).fill('')]);
  const names = SOURCE_BLOCKS.flatMap((block) => (block.withTarget ? WITH_TARGET_HEADERS : WITHOUT_TARGET_HEADERS));
  return [
    ['дата', 'смена', ...titles, ...TOTAL_HEADERS],
    ['', '', ...names, ...TOTAL_HEADERS.map(() => '')],
  ];
}

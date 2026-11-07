/**
 * 概要の表の列。見出しと各行で同じ幅を使う。
 * 幅の合計は約 790px（列 8 つ + 列間 gap-2 の 7 つ）。
 * 与ダメージと被ダメージは 1 つの列に左右で並べる。
 */
export const COLUMNS = [
  { key: 'champion', label: 'チャンピオン', className: 'w-9' },
  { key: 'spells', label: '', className: 'w-9' },
  { key: 'name', label: '名前', className: 'w-32' },
  { key: 'kda', label: 'KDA', className: 'w-[120px] text-center' },
  {
    key: 'damage',
    label: '与 / 被ダメージ',
    className: 'w-32 text-center',
  },
  { key: 'ward', label: 'ワード', className: 'w-12 text-center' },
  { key: 'cs', label: 'CS', className: 'w-14 text-center' },
  { key: 'items', label: 'アイテム', className: 'w-[180px]' },
] as const;

export type ColumnKey = (typeof COLUMNS)[number]['key'];

export const COLUMN_CLASSES: Record<ColumnKey, string> = Object.fromEntries(
  COLUMNS.map((c) => [c.key, `${c.className} shrink-0`])
) as Record<ColumnKey, string>;

/** 表の最小幅。これより狭い画面では横にスクロールする */
export const TABLE_MIN_WIDTH_CLASS = 'min-w-[830px]';

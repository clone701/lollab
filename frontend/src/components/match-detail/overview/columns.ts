/** 概要の表の列。見出しと各行で同じ幅を使う */
export const COLUMNS = [
  { key: 'champion', label: 'チャンピオン', className: 'w-14' },
  { key: 'spells', label: 'スペル・ルーン', className: 'w-14' },
  { key: 'name', label: '名前', className: 'w-36' },
  { key: 'kda', label: 'KDA', className: 'w-28' },
  { key: 'damage', label: '与ダメージ', className: 'w-28' },
  { key: 'taken', label: '被ダメージ', className: 'w-28' },
  { key: 'ward', label: 'ワード', className: 'w-16' },
  { key: 'cs', label: 'CS', className: 'w-16' },
  { key: 'items', label: 'アイテム', className: 'w-[200px]' },
] as const;

export type ColumnKey = (typeof COLUMNS)[number]['key'];

export const COLUMN_CLASSES: Record<ColumnKey, string> = Object.fromEntries(
  COLUMNS.map((c) => [c.key, `${c.className} shrink-0`])
) as Record<ColumnKey, string>;

/** 表の最小幅。これより狭い画面では横にスクロールする */
export const TABLE_MIN_WIDTH_CLASS = 'min-w-[1000px]';

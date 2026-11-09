import type { BuildIconProps } from '@/components/ui/BuildIcon';

/** JSON の読み込み状態 */
export type GameDataState<T> =
  { status: 'loading' } | { status: 'error' } | { status: 'data'; data: T };

/** ツールチップ付きアイコンの props。id と BuildIcon の props（title は付けない） */
export type TooltipIconProps = { id: number } & Omit<
  BuildIconProps,
  'showTitle'
>;

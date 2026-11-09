import type { BuildIconProps } from '@/components/ui/BuildIcon';
import type { DdragonChampion, SkillInfo } from '@/lib/game-data';

/** チャンピオン1体分の情報。読み込み前・失敗時は両方 null */
export interface ChampionDetail {
  /** パッシブと Q/W/E/R（数値入りの説明文つき） */
  skills: SkillInfo[] | null;
  /** Data Dragon のチャンピオン（基礎情報） */
  champion: DdragonChampion | null;
}

/** JSON の読み込み状態 */
export type GameDataState<T> =
  { status: 'loading' } | { status: 'error' } | { status: 'data'; data: T };

/** ツールチップ付きアイコンの props。id と BuildIcon の props（title は付けない） */
export type TooltipIconProps = { id: number } & Omit<
  BuildIconProps,
  'showTitle'
>;

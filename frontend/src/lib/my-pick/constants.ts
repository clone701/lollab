import type { PickLane } from '@/types/myPick';

/** 1行（相手1体）に持てるピックの最大数 */
export const MAX_PICKS = 10;

/** 編集画面で最初に出す枠の数 */
export const MIN_SLOTS = 3;

/** 表の名前の最大文字数 */
export const MAX_SHEET_NAME_LENGTH = 50;

/** ピックが未入力の行に使う空の配列（参照を共有して再描画を減らす。書き換えない） */
export const EMPTY_PICKS: string[] = [];

/** レーンの並び順 */
export const PICK_LANES: PickLane[] = [
  'TOP',
  'JUNGLE',
  'MIDDLE',
  'BOTTOM',
  'UTILITY',
];

/** レーンの表示名 */
export const LANE_LABELS: Record<PickLane, string> = {
  TOP: 'TOP',
  JUNGLE: 'JUNGLE',
  MIDDLE: 'MID',
  BOTTOM: 'BOT',
  UTILITY: 'SUPPORT',
};

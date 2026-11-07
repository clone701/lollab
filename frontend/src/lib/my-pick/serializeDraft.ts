import type { PickLane } from '@/types/myPick';
import { toPickRows } from './toPickRows';

/**
 * 編集中の内容を比較用の文字列にする。
 * 初期値と現在値を比べて、未保存の変更があるかの判定に使う。
 */
export function serializeDraft(
  name: string,
  lane: PickLane,
  picksByEnemy: Record<string, string[]>
): string {
  return JSON.stringify([name, lane, toPickRows(picksByEnemy)]);
}

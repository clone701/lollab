import type { PickLane, PickSheet } from '@/types/myPick';

/** pick_sheets テーブルの行 */
export interface RawPickSheet {
  id: number;
  name: string;
  lane: PickLane;
  created_at: string;
  updated_at: string;
}

/** pick_sheets の列（select に渡す） */
export const PICK_SHEET_COLUMNS = 'id, name, lane, created_at, updated_at';

/** DB の行を画面用の型にする。entryCount は入力済みの相手の数 */
export function mapPickSheet(raw: RawPickSheet, entryCount: number): PickSheet {
  return {
    id: raw.id,
    name: raw.name,
    lane: raw.lane,
    entryCount,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

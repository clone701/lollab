import { createClient } from '@/lib/supabase/client';
import {
  PICK_LANES,
  toPickMap,
  toPickRows,
  validateSheetName,
} from '@/lib/my-pick';
import type { PickLane, PickRow } from '@/types/myPick';
import { failSave } from './failSave';

/**
 * 表の名前・レーンを更新し、その表のピックを全件入れ直す。
 * 空の行は保存しない。複数のリクエストに分かれるため原子的ではない
 * （途中で失敗したら例外を投げるので、呼び出し側は編集内容を残して再保存させる）。
 */
export async function savePickSheet(
  id: number,
  name: string,
  lane: PickLane,
  rows: PickRow[]
): Promise<void> {
  const checked = validateSheetName(name);
  if (checked.error) throw new Error(checked.error);
  if (!PICK_LANES.includes(lane)) throw new Error('レーンが正しくありません');
  const entries = toPickRows(toPickMap(rows));

  const supabase = createClient();

  const updated = await supabase
    .from('pick_sheets')
    .update({ name: checked.value, lane })
    .eq('id', id)
    .select('id');
  if (updated.error) failSave('Failed to update pick sheet:', updated.error);
  if (!updated.data || updated.data.length === 0) {
    throw new Error('マイピック表が見つかりません');
  }

  const deleted = await supabase
    .from('pick_sheet_entries')
    .delete()
    .eq('sheet_id', id);
  if (deleted.error) failSave('Failed to delete pick entries:', deleted.error);

  if (entries.length === 0) return;
  const inserted = await supabase.from('pick_sheet_entries').insert(
    entries.map((row) => ({
      sheet_id: id,
      enemy_champion_id: row.enemyChampionId,
      pick_champion_ids: row.pickChampionIds,
    }))
  );
  if (inserted.error)
    failSave('Failed to insert pick entries:', inserted.error);
}

import { createClient } from '@/lib/supabase/client';
import { PICK_LANES, validateSheetName } from '@/lib/my-pick';
import type { PickLane, PickSheet } from '@/types/myPick';
import {
  mapPickSheet,
  PICK_SHEET_COLUMNS,
  type RawPickSheet,
} from './mapPickSheet';

/** マイピック表を作る。user_id は DB の既定値（auth.uid()）に任せる */
export async function createPickSheet(
  name: string,
  lane: PickLane
): Promise<PickSheet> {
  const checked = validateSheetName(name);
  if (checked.error) throw new Error(checked.error);
  if (!PICK_LANES.includes(lane)) throw new Error('レーンが正しくありません');

  const supabase = createClient();

  const { data, error } = await supabase
    .from('pick_sheets')
    .insert({ name: checked.value, lane })
    .select(PICK_SHEET_COLUMNS)
    .single();

  if (error) {
    console.error('Failed to create pick sheet:', error);
    throw new Error('マイピック表の作成に失敗しました');
  }

  return mapPickSheet(data as RawPickSheet, 0);
}

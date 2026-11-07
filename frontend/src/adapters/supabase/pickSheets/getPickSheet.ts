import { createClient } from '@/lib/supabase/client';
import type { PickRow, PickSheetDetail } from '@/types/myPick';
import {
  mapPickSheet,
  PICK_SHEET_COLUMNS,
  type RawPickSheet,
} from './mapPickSheet';

interface RawEntry {
  enemy_champion_id: string;
  pick_champion_ids: string[];
}

interface RawPickSheetWithEntries extends RawPickSheet {
  pick_sheet_entries: RawEntry[] | null;
}

/** 表とそのピックを1回のリクエストで取得する。見つからなければ null */
export async function getPickSheet(
  id: number
): Promise<PickSheetDetail | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('pick_sheets')
    .select(
      `${PICK_SHEET_COLUMNS}, pick_sheet_entries(enemy_champion_id, pick_champion_ids)`
    )
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch pick sheet:', error);
    throw new Error('マイピック表の取得に失敗しました');
  }
  if (!data) return null;

  const raw = data as RawPickSheetWithEntries;
  const rows: PickRow[] = (raw.pick_sheet_entries ?? []).map((entry) => ({
    enemyChampionId: entry.enemy_champion_id,
    pickChampionIds: entry.pick_champion_ids,
  }));
  return { ...mapPickSheet(raw, rows.length), rows };
}

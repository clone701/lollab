import { createClient } from '@/lib/supabase/client';
import type { PickSheet } from '@/types/myPick';
import {
  mapPickSheet,
  PICK_SHEET_COLUMNS,
  type RawPickSheet,
} from './mapPickSheet';

interface RawPickSheetWithCount extends RawPickSheet {
  pick_sheet_entries: { count: number }[] | null;
}

/** マイピック表の一覧（更新日時の新しい順）。RLS により本人の表だけが返る */
export async function getPickSheets(): Promise<PickSheet[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('pick_sheets')
    .select(`${PICK_SHEET_COLUMNS}, pick_sheet_entries(count)`)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch pick sheets:', error);
    throw new Error('マイピック表の取得に失敗しました');
  }

  return ((data ?? []) as RawPickSheetWithCount[]).map((row) =>
    mapPickSheet(row, row.pick_sheet_entries?.[0]?.count ?? 0)
  );
}

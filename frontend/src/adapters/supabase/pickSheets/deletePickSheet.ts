import { createClient } from '@/lib/supabase/client';

/** マイピック表を削除する。ピックは外部キーの ON DELETE CASCADE で一緒に消える */
export async function deletePickSheet(id: number): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from('pick_sheets').delete().eq('id', id);

  if (error) {
    console.error('Failed to delete pick sheet:', error);
    throw new Error('マイピック表の削除に失敗しました');
  }
}

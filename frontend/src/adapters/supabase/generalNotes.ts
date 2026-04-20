/**
 * GeneralNotesAdapter — 汎用ノートCRUD操作
 * RLSにより自動的にユーザーフィルタリングが行われる
 */

import { createClient } from '@/lib/supabase/client';
import { GeneralNote, GeneralNoteFormData } from '@/types/generalNote';

export async function getGeneralNotes(): Promise<GeneralNote[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('general_notes')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch general notes:', error);
    throw new Error('ノートの取得に失敗しました');
  }

  return data || [];
}

export async function createGeneralNote(
  formData: GeneralNoteFormData
): Promise<GeneralNote> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('認証が必要です');

  const { data, error } = await supabase
    .from('general_notes')
    .insert({ ...formData, user_id: user.id })
    .select()
    .single();

  if (error) {
    console.error('Failed to create general note:', error);
    throw new Error('ノートの作成に失敗しました');
  }

  return data;
}

export async function updateGeneralNote(
  id: number,
  formData: GeneralNoteFormData
): Promise<GeneralNote> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('general_notes')
    .update({ ...formData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Failed to update general note:', error);
    throw new Error('ノートの更新に失敗しました');
  }

  return data;
}

export async function deleteGeneralNote(id: number): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from('general_notes').delete().eq('id', id);

  if (error) {
    console.error('Failed to delete general note:', error);
    throw new Error('ノートの削除に失敗しました');
  }
}

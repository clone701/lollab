/**
 * NotesAdapter — Supabase ノートCRUD操作
 * lib/api/notes.ts から移植
 */

import { createClient } from '@/lib/supabase/client';
import { ChampionNote, RuneConfig } from '@/types/note';

export async function getAllNotes(): Promise<ChampionNote[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('champion_notes')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch all notes:', error);
    throw new Error('ノートの取得に失敗しました');
  }

  return data || [];
}

export async function getNotes(
  myChampionId: string,
  enemyChampionId: string
): Promise<ChampionNote[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('champion_notes')
    .select('*')
    .eq('my_champion_id', myChampionId)
    .eq('enemy_champion_id', enemyChampionId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch notes:', error);
    throw new Error('ノートの取得に失敗しました');
  }

  return data || [];
}

export async function createNote(
  note: Omit<ChampionNote, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<ChampionNote> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('認証が必要です');

  const { data, error } = await supabase
    .from('champion_notes')
    .insert({ ...note, user_id: user.id })
    .select()
    .single();

  if (error) {
    console.error('Failed to create note:', error);
    throw new Error('ノートの作成に失敗しました');
  }

  return data;
}

export async function fetchNoteById(
  noteId: string,
  userId: string
): Promise<ChampionNote | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('champion_notes')
    .select('*')
    .eq('id', noteId)
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Failed to fetch note:', error);
    return null;
  }

  return data;
}

export interface NoteUpdateData {
  preset_name: string;
  runes: RuneConfig | null;
  spells: string[] | null;
  items: string[] | null;
  memo: string | null;
}

export async function updateNote(
  noteId: string,
  userId: string,
  data: NoteUpdateData
): Promise<ChampionNote | null> {
  const supabase = createClient();

  const { data: updatedNote, error } = await supabase
    .from('champion_notes')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', noteId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Failed to update note:', error);
    throw new Error('ノートの更新に失敗しました');
  }

  return updatedNote;
}

export async function deleteNote(
  noteId: string,
  userId: string
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('champion_notes')
    .delete()
    .eq('id', noteId)
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to delete note:', error);
    throw new Error('ノートの削除に失敗しました');
  }
}

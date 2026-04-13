/**
 * ノートAPI関数
 * 
 * チャンピオン対策ノートのCRUD操作を提供します。
 * Supabase AuthとRLSポリシーにより、ユーザーは自分のノートのみアクセス可能です。
 */

import { createClient } from '@/lib/supabase/client';
import { ChampionNote } from '@/types/note';

/**
 * ノート一覧を取得
 * 
 * 指定されたマッチアップ（自分のチャンピオン vs 相手のチャンピオン）のノートを取得します。
 * RLSポリシーにより、現在のユーザーのノートのみが返されます。
 * 
 * @param myChampionId - 自分のチャンピオンID
 * @param enemyChampionId - 相手のチャンピオンID
 * @returns ノートの配列（更新日時の降順）
 * @throws ノートの取得に失敗した場合
 */
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

/**
 * ノートを作成
 * 
 * 新しいチャンピオン対策ノートを作成します。
 * ユーザーIDはSupabase Authから自動的に取得され、RLSポリシーで検証されます。
 * 
 * @param note - 作成するノートデータ（id, user_id, created_at, updated_atは自動設定）
 * @returns 作成されたノート
 * @throws 認証が必要な場合、またはノートの作成に失敗した場合
 */
export async function createNote(
    note: Omit<ChampionNote, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<ChampionNote> {
    const supabase = createClient();

    // ユーザー認証確認
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('認証が必要です');
    }

    const { data, error } = await supabase
        .from('champion_notes')
        .insert({
            ...note,
            user_id: user.id,
        })
        .select()
        .single();

    if (error) {
        console.error('Failed to create note:', error);
        throw new Error('ノートの作成に失敗しました');
    }

    return data;
}

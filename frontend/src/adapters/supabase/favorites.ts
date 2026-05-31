// お気に入りAdapter — Supabase直接操作
import { createClient } from '@/lib/supabase/client';
import type { Region } from '@/types/summoner';

export interface FavoriteEntry {
  id: string;
  summoner_name: string;
  tag_line: string;
  region: string;
  created_at: string;
}

const MAX_FAVORITES = 10;

export async function fetchFavorites(): Promise<FavoriteEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('favorites')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addFavorite(
  summonerName: string,
  tagLine: string,
  region: Region
): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  // 上限チェック
  const { count } = await supabase
    .from('favorites')
    .select('id', { count: 'exact', head: true });
  if (count !== null && count >= MAX_FAVORITES) return false;

  const { error } = await supabase.from('favorites').insert({
    user_id: user.id,
    summoner_name: summonerName,
    tag_line: tagLine,
    region,
  });
  if (error && error.code === '23505') return true; // 重複は成功扱い
  if (error) throw error;
  return true;
}

export async function removeFavorite(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('favorites').delete().eq('id', id);
  if (error) throw error;
}

export async function isFavorite(
  summonerName: string,
  tagLine: string,
  region: Region
): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase
    .from('favorites')
    .select('id')
    .eq('summoner_name', summonerName)
    .eq('tag_line', tagLine)
    .eq('region', region)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

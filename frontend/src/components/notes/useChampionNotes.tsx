'use client';

import { useEffect, useState } from 'react';
import { ChampionNote } from '@/types/note';
import { getNotes } from '@/adapters/supabase';

interface UseChampionNotesReturn {
  notes: ChampionNote[];
  loading: boolean;
  error: string | null;
}

// マッチアップ（自分 vs 相手）のノートを取得する
export function useChampionNotes(
  myChampionId: string | null,
  enemyChampionId: string | null
): UseChampionNotesReturn {
  const [notes, setNotes] = useState<ChampionNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 取得対象が変わったら、取得完了まで読み込み中に戻す（レンダー中に前回値と比較）
  const fetchKey = `${myChampionId}/${enemyChampionId}`;
  const [prevFetchKey, setPrevFetchKey] = useState(fetchKey);
  if (prevFetchKey !== fetchKey) {
    setPrevFetchKey(fetchKey);
    setLoading(true);
    setError(null);
  }

  useEffect(() => {
    if (!myChampionId || !enemyChampionId) return;
    let isStale = false;
    getNotes(myChampionId, enemyChampionId)
      .then((data) => {
        if (!isStale) setNotes(data);
      })
      .catch((err) => {
        if (isStale) return;
        setError('ノートの取得に失敗しました');
        console.error('Failed to fetch notes:', err);
      })
      .finally(() => {
        if (!isStale) setLoading(false);
      });
    return () => {
      isStale = true;
    };
  }, [myChampionId, enemyChampionId]);

  return { notes, loading, error };
}

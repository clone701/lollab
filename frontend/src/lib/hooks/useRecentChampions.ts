/**
 * useRecentChampions - 直近選択したチャンピオンを管理するカスタムフック
 *
 * localStorageを使用して、ユーザーが選択したチャンピオンの履歴を保存・取得します。
 * 最大10件まで保存し、古いものから削除されます。
 */

'use client';

import { useMemo, useCallback, useSyncExternalStore } from 'react';
import { Champion } from '@/types/champion';
import { champions } from '@/lib/data/champions';
import {
  MAX_RECENT_CHAMPIONS,
  getSnapshot,
  getServerSnapshot,
  subscribe,
  parseRecentChampionIds,
  saveRecentChampionIds,
} from './recentChampionsStore';

/**
 * 直近選択したチャンピオンを管理するカスタムフック
 *
 * @returns {Object} recentChampions - 直近選択したチャンピオンの配列（最大10件）
 * @returns {Function} addRecentChampion - チャンピオンを履歴に追加する関数
 */
export default function useRecentChampions() {
  // localStorage を外部ストアとして購読する（サーバー/ハイドレーション中は履歴なし）
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const recentChampionIds = useMemo(() => parseRecentChampionIds(raw), [raw]);

  // チャンピオンIDからChampionオブジェクトに変換
  const recentChampions: Champion[] = recentChampionIds
    .map((id) => champions.find((c) => c.id === id))
    .filter((c): c is Champion => c !== undefined);

  /**
   * チャンピオンを履歴に追加
   * - 既に存在する場合は最前面に移動
   * - 存在しない場合は先頭に追加
   * - 10件を超える場合は古いものを削除
   */
  const addRecentChampion = useCallback((championId: string) => {
    const prevIds = parseRecentChampionIds(getSnapshot());
    const newIds = [championId, ...prevIds.filter((id) => id !== championId)];
    saveRecentChampionIds(newIds.slice(0, MAX_RECENT_CHAMPIONS));
  }, []);

  return {
    recentChampions,
    addRecentChampion,
  };
}

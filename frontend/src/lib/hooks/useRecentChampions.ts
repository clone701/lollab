/**
 * useRecentChampions - 直近選択したチャンピオンを管理するカスタムフック
 *
 * localStorageを使用して、ユーザーが選択したチャンピオンの履歴を保存・取得します。
 * 最大10件まで保存し、古いものから削除されます。
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Champion } from '@/types/champion';
import { champions } from '@/lib/data/champions';

const STORAGE_KEY = 'lollab_recent_champions';
const MAX_RECENT_CHAMPIONS = 10;

/**
 * 直近選択したチャンピオンIDをlocalStorageから取得
 */
function getRecentChampionIds(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const ids = JSON.parse(stored);
    return Array.isArray(ids) ? ids : [];
  } catch (error) {
    console.error('Failed to load recent champions:', error);
    return [];
  }
}

/**
 * 直近選択したチャンピオンIDをlocalStorageに保存
 */
function saveRecentChampionIds(ids: string[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch (error) {
    console.error('Failed to save recent champions:', error);
  }
}

/**
 * 直近選択したチャンピオンを管理するカスタムフック
 *
 * @returns {Object} recentChampions - 直近選択したチャンピオンの配列（最大10件）
 * @returns {Function} addRecentChampion - チャンピオンを履歴に追加する関数
 */
export default function useRecentChampions() {
  const [recentChampionIds, setRecentChampionIds] = useState<string[]>([]);

  // 初回マウント時にlocalStorageから読み込み
  useEffect(() => {
    setRecentChampionIds(getRecentChampionIds());
  }, []);

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
    setRecentChampionIds((prevIds) => {
      // 既存の履歴から該当IDを削除（重複を防ぐ）
      const filteredIds = prevIds.filter((id) => id !== championId);

      // 先頭に新しいIDを追加
      const newIds = [championId, ...filteredIds];

      // 最大10件に制限
      const limitedIds = newIds.slice(0, MAX_RECENT_CHAMPIONS);

      // localStorageに保存
      saveRecentChampionIds(limitedIds);

      return limitedIds;
    });
  }, []);

  return {
    recentChampions,
    addRecentChampion,
  };
}

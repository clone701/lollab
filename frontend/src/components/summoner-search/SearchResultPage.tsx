'use client';

import { useEffect, useState } from 'react';
import type { Region } from '@/types/summoner';
import { REGION_DEFAULT_TAGS } from '@/types/summoner';
import useSummonerDetail from '@/lib/hooks/useSummonerDetail';
import { useAuth } from '@/lib/contexts/AuthContext';
import {
  isFavorite as checkFavorite,
  addFavorite,
  removeFavorite,
  fetchFavorites,
} from '@/adapters/supabase/favorites';
import SummonerProfile from './SummonerProfile';
import RankInfo from './RankInfo';
import TabNavigation from './TabNavigation';
import type { TabType } from './TabNavigation';
import MatchHistory from './MatchHistory';
import ChampionStats from './ChampionStats';

interface SearchResultPageProps {
  query: string;
  region: Region;
  onSearch: (query: string, region: Region) => void;
}

export default function SearchResultPage({
  query,
  region,
  onSearch,
}: SearchResultPageProps) {
  const { user } = useAuth();
  const [gameName, tagLine] = query.includes('#')
    ? query.split('#')
    : [query, REGION_DEFAULT_TAGS[region]];
  const { detail, isLoading, error, isUpdating, updateError, update } =
    useSummonerDetail(region, gameName, tagLine);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isFav, setIsFav] = useState(false);
  const [favId, setFavId] = useState<string | null>(null);

  // 未ログイン中はお気に入り状態を持たない（レンダー中に初期化）
  if (!user && (isFav || favId)) {
    setIsFav(false);
    setFavId(null);
  }

  useEffect(() => {
    if (!query || !user) return;
    // お気に入り状態チェック
    checkFavorite(gameName, tagLine, region)
      .then(setIsFav)
      .catch(() => setIsFav(false));
    fetchFavorites()
      .then((favs) => {
        const match = favs.find(
          (f) =>
            f.summoner_name === gameName &&
            f.tag_line === tagLine &&
            f.region === region
        );
        setFavId(match?.id ?? null);
      })
      .catch(() => {});
  }, [query, region, user, gameName, tagLine]);

  const handleToggleFavorite = async () => {
    if (!user) {
      alert('お気に入り機能にはログインが必要です');
      return;
    }
    if (!detail) return;
    const { name, tagLine } = detail.summoner;
    try {
      if (isFav && favId) {
        await removeFavorite(favId);
        setIsFav(false);
        setFavId(null);
      } else {
        const added = await addFavorite(name, tagLine, region);
        if (!added) {
          alert('お気に入りは最大10人までです');
          return;
        }
        setIsFav(true);
        // IDを取得
        const favs = await fetchFavorites();
        const match = favs.find(
          (f) =>
            f.summoner_name === name &&
            f.tag_line === tagLine &&
            f.region === region
        );
        setFavId(match?.id ?? null);
      }
    } catch {
      alert('お気に入りの更新に失敗しました');
    }
  };

  return (
    <main className="py-8 px-4">
      {/* ヘッダー */}
      <div className="mb-4 flex items-center gap-2 text-sm text-fg-muted">
        <span className="font-bold text-fg-muted bg-surface-2 border border-line-strong rounded px-2 py-0.5 text-xs">
          {region}
        </span>
        <span className="font-medium text-fg">{query}</span>
        <button
          type="button"
          onClick={() => onSearch('', region)}
          className="ml-2 text-accent hover:underline text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          ← 戻る
        </button>
      </div>

      {/* ローディング */}
      {isLoading && (
        <div className="flex flex-col items-center py-16 gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/loading/nunu.gif"
            alt="読み込み中"
            className="w-32 h-32"
          />
          <span className="text-fg-muted text-sm">読み込み中...</span>
        </div>
      )}

      {/* エラー */}
      {error && <div className="text-center py-16 text-danger-fg">{error}</div>}

      {/* 結果: プロフィールバー → タブメニュー → タブコンテンツ */}
      {!isLoading && !error && detail && (
        <div className="flex flex-col gap-0">
          <SummonerProfile
            summoner={detail.summoner}
            rankPosition={detail.rankPosition}
            isFavorite={isFav}
            onToggleFavorite={handleToggleFavorite}
            isLoggedIn={!!user}
            isUpdating={isUpdating}
            onUpdate={update}
            updateError={updateError}
          />

          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

          <div className="mt-4">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-4">
                  <RankInfo rank={detail.summoner.rank} />
                  <ChampionStats champions={detail.championStats} />
                </div>
                <div className="md:col-span-2">
                  <MatchHistory matches={detail.matches} />
                </div>
              </div>
            )}
            {activeTab === 'champions' && (
              <div className="text-center py-8 text-fg-muted">
                チャンピオン詳細（今後実装）
              </div>
            )}
            {activeTab === 'live-game' && (
              <div className="text-center py-8 text-fg-muted">
                現在の対戦情報（今後実装）
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

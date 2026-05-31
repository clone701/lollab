'use client';

import { useEffect, useState } from 'react';
import type {
  Region,
  SummonerData,
  MatchData,
  ChampionStatData,
  RankPositionData,
} from '@/types/summoner';
import { REGION_DEFAULT_TAGS } from '@/types/summoner';
import {
  fetchSummoner,
  fetchMatches,
  fetchChampionStats,
  fetchRankPosition,
} from '@/lib/api/summoner';
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

interface ResultState {
  summoner: SummonerData | null;
  matches: MatchData[];
  championStats: ChampionStatData[];
  rankPosition: RankPositionData | null;
  isLoading: boolean;
  error: string | null;
}

export default function SearchResultPage({
  query,
  region,
  onSearch,
}: SearchResultPageProps) {
  const { user } = useAuth();
  const [state, setState] = useState<ResultState>({
    summoner: null,
    matches: [],
    championStats: [],
    rankPosition: null,
    isLoading: true,
    error: null,
  });
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isFav, setIsFav] = useState(false);
  const [favId, setFavId] = useState<string | null>(null);

  useEffect(() => {
    if (!query) return;

    const [gameName, tagLine] = query.includes('#')
      ? query.split('#')
      : [query, REGION_DEFAULT_TAGS[region]];

    // お気に入り状態チェック
    if (user) {
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
    } else {
      setIsFav(false);
      setFavId(null);
    }

    setState({
      summoner: null,
      matches: [],
      championStats: [],
      rankPosition: null,
      isLoading: true,
      error: null,
    });

    // サモナー情報を先に取得して即表示
    fetchSummoner(region, gameName, tagLine)
      .then((summoner) => {
        setState((prev) => ({ ...prev, summoner, isLoading: false }));
        // 残りを並列で取得し、取得次第反映
        fetchMatches(region, gameName, tagLine)
          .then((matches) => setState((prev) => ({ ...prev, matches })))
          .catch(() => {});
        fetchChampionStats(region, gameName, tagLine)
          .then((championStats) =>
            setState((prev) => ({ ...prev, championStats }))
          )
          .catch(() => {});
        fetchRankPosition(region, gameName, tagLine)
          .then((rankPosition) =>
            setState((prev) => ({ ...prev, rankPosition }))
          )
          .catch(() => {});
      })
      .catch((e: unknown) => {
        const message =
          e instanceof Error ? e.message : '予期しないエラーが発生しました';
        setState({
          summoner: null,
          matches: [],
          championStats: [],
          rankPosition: null,
          isLoading: false,
          error: message,
        });
      });
  }, [query, region, user]);

  const handleToggleFavorite = async () => {
    if (!user) {
      alert('お気に入り機能にはログインが必要です');
      return;
    }
    if (!state.summoner) return;
    const { name, tagLine } = state.summoner;
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
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
        <span className="font-bold text-gray-700 bg-gray-100 border border-gray-300 rounded px-2 py-0.5 text-xs">
          {region}
        </span>
        <span className="font-medium text-gray-800">{query}</span>
        <button
          type="button"
          onClick={() => onSearch('', region)}
          className="ml-2 text-blue-500 hover:underline text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          ← 戻る
        </button>
      </div>

      {/* ローディング */}
      {state.isLoading && (
        <div className="flex flex-col items-center py-16 gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/loading/nunu.gif"
            alt="読み込み中"
            className="w-32 h-32"
          />
          <span className="text-gray-500 text-sm">読み込み中...</span>
        </div>
      )}

      {/* エラー */}
      {state.error && (
        <div className="text-center py-16 text-red-500">{state.error}</div>
      )}

      {/* 結果: プロフィールバー → タブメニュー → タブコンテンツ */}
      {!state.isLoading && !state.error && state.summoner && (
        <div className="flex flex-col gap-0">
          <SummonerProfile
            summoner={state.summoner}
            rankPosition={state.rankPosition}
            isFavorite={isFav}
            onToggleFavorite={handleToggleFavorite}
            isLoggedIn={!!user}
          />

          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

          <div className="mt-4">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-4">
                  <RankInfo rank={state.summoner.rank} />
                  {state.championStats.length > 0 ? (
                    <ChampionStats champions={state.championStats} />
                  ) : (
                    <div className="flex justify-center py-8">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/images/loading/nunu.gif"
                        alt="読み込み中"
                        className="w-16 h-16"
                      />
                    </div>
                  )}
                </div>
                <div className="md:col-span-2">
                  {state.matches.length > 0 ? (
                    <MatchHistory matches={state.matches} />
                  ) : (
                    <div className="flex justify-center py-8">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/images/loading/nunu.gif"
                        alt="読み込み中"
                        className="w-16 h-16"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeTab === 'champions' && (
              <div className="text-center py-8 text-gray-500">
                チャンピオン詳細（今後実装）
              </div>
            )}
            {activeTab === 'live-game' && (
              <div className="text-center py-8 text-gray-500">
                現在の対戦情報（今後実装）
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

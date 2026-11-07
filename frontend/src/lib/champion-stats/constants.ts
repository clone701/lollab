import type { ChampionStatsQueue } from '@/types/summoner';

/** 初めに表示するチャンピオンの件数 */
export const INITIAL_VISIBLE_COUNT = 6;

/** キューのタブ（表示順）。初期表示は先頭の「全体」 */
export const CHAMPION_STATS_TABS: { id: ChampionStatsQueue; label: string }[] =
  [
    { id: 'all', label: '全体' },
    { id: 'solo', label: 'ソロランク' },
    { id: 'flex', label: 'フレックス' },
  ];

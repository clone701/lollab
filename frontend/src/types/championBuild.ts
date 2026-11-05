// バックエンドの schemas/champion.py と同じ形にする

export type Role = 'TOP' | 'JUNGLE' | 'MIDDLE' | 'BOTTOM' | 'UTILITY';
export type Period = 'latest_patch' | 'last_30_days' | 'all';
export type QueueFilter = 'all' | 'solo' | 'flex';

/** 最高勝率 / 最多の切り替え（画面内の状態） */
export type BuildMode = 'best_win_rate' | 'most_games';

/** ビルド要素の選択肢1つ分。key はスキル(1〜4)・アイテム・ルーン・スペルの ID */
export interface BuildOption {
  key: number[];
  games: number;
  wins: number;
}

export interface BuildElement {
  games: number;
  /** 試合数の多い順、最大10件 */
  options: BuildOption[];
  best_win_rate: BuildOption | null;
}

/** 比率（win_rate_delta・pick_rate・ban_rate）は 0〜1 */
export interface ChampionBuildSummary {
  games: number;
  wins: number;
  win_rate_delta: number;
  pick_rate: number;
  ban_rate: number;
}

export interface ChampionBuildResponse {
  champion_name: string;
  role: string | null;
  roles: Record<string, number>;
  period: string;
  queue: string;
  latest_patch: string | null;
  summary: ChampionBuildSummary;
  skill_priority: BuildElement;
  skill_order: BuildElement;
  spells: BuildElement;
  starting_items: BuildElement;
  core_items: BuildElement;
  item4: BuildElement;
  item5: BuildElement;
  item6: BuildElement;
  /** [primary_style, p1, p2, p3, p4, sub_style, s1, s2, shard1, shard2, shard3] */
  runes: BuildElement;
}

/** ビルド画面を決める URL クエリ */
export interface BuildQuery {
  role?: Role;
  period: Period;
  queue: QueueFilter;
}

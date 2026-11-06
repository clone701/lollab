import type {
  BuildMode,
  Period,
  QueueFilter,
  RankFilter,
  Role,
} from '@/types/championBuild';

export const DEFAULT_PERIOD: Period = 'latest_patch';
export const DEFAULT_QUEUE: QueueFilter = 'all';
export const DEFAULT_RANK: RankFilter = 'all';

export const ROLE_LABELS: Record<Role, string> = {
  TOP: 'トップ',
  JUNGLE: 'ジャングル',
  MIDDLE: 'ミッド',
  BOTTOM: 'ボット',
  UTILITY: 'サポート',
};

export const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'latest_patch', label: '最新パッチ' },
  { value: 'last_30_days', label: '直近30日' },
  { value: 'all', label: '全期間' },
];

export const QUEUE_OPTIONS: { value: QueueFilter; label: string }[] = [
  { value: 'all', label: 'ソロ/デュオ + フレックス' },
  { value: 'solo', label: 'ソロ/デュオ' },
  { value: 'flex', label: 'フレックス' },
];

export const RANK_OPTIONS: { value: RankFilter; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'emerald_plus', label: 'エメラルド以上' },
  { value: 'diamond_plus', label: 'ダイヤモンド以上' },
  { value: 'master_plus', label: 'マスター以上' },
];

export const MODE_OPTIONS: { value: BuildMode; label: string }[] = [
  { value: 'best_win_rate', label: '最高勝率ビルド' },
  { value: 'most_games', label: '最多ビルド' },
];

/** スキルキー 1〜4 に対応する表記 */
export const SKILL_LABELS = ['Q', 'W', 'E', 'R'] as const;

/** スキル順のマス目に表示するレベル数 */
export const SKILL_ORDER_LEVELS = 15;

/** Riot の championName が Data Dragon の ID（champions.ts の id）と異なるチャンピオン */
export const RIOT_CHAMPION_NAMES: Record<string, string> = {
  Wukong: 'MonkeyKing',
  Fiddlesticks: 'FiddleSticks',
};

/** ローカルに無いアイテム画像の取得先（Data Dragon のバージョン） */
export const DDRAGON_VERSION = '16.22.1';

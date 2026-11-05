-- ビルド集計・試合詳細用データの追加マイグレーション
-- 説明: champion-stats（チャンピオンビルド集計）のため、matches / match_participants に列を追加し、
--       match_bans / summoner_rank_snapshots を作成する。
--       あわせて試合の生データ保管用の Storage バケット riot-raw を作成する。
--
-- 注意: match_bans は matches への外部キー（ON DELETE CASCADE）を持つ。
--       summoner_rank_snapshots と summoners の間に外部キーは張らない（クローラーが集めるランクも記録するため）。

-- ============================================================================
-- 1. matches に列を追加
-- ============================================================================

ALTER TABLE matches ADD COLUMN IF NOT EXISTS patch               text;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS is_remake           boolean      NOT NULL DEFAULT false;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS detail_version      int          NOT NULL DEFAULT 1;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS timeline_fetched_at timestamptz;

COMMENT ON COLUMN matches.patch IS 'game_version の先頭2要素（例: 16.22）。パッチでの絞り込み用';
COMMENT ON COLUMN matches.is_remake IS 'リメイク（早期降伏）の試合か。統計から除外する';
COMMENT ON COLUMN matches.detail_version IS '試合詳細から取り込んだ項目の版。2 = ルーン全構成・シャード・BAN を含む';
COMMENT ON COLUMN matches.timeline_fetched_at IS 'タイムライン由来の項目を取り込んだ日時。未取得は NULL';

-- ============================================================================
-- 2. match_participants に列を追加
-- ============================================================================

ALTER TABLE match_participants ADD COLUMN IF NOT EXISTS primary_perk_ids int[];
ALTER TABLE match_participants ADD COLUMN IF NOT EXISTS sub_perk_ids     int[];
ALTER TABLE match_participants ADD COLUMN IF NOT EXISTS stat_perk_ids    int[];
ALTER TABLE match_participants ADD COLUMN IF NOT EXISTS skill_order      smallint[];
ALTER TABLE match_participants ADD COLUMN IF NOT EXISTS starting_items   int[];
ALTER TABLE match_participants ADD COLUMN IF NOT EXISTS completed_items  int[];
ALTER TABLE match_participants ADD COLUMN IF NOT EXISTS patch            text;
ALTER TABLE match_participants ADD COLUMN IF NOT EXISTS is_remake        boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN match_participants.primary_perk_ids IS 'メインルーン4つ（キーストーン含む、スロット順）。detail_version 2 以降';
COMMENT ON COLUMN match_participants.sub_perk_ids IS 'サブルーン2つ。detail_version 2 以降';
COMMENT ON COLUMN match_participants.stat_perk_ids IS 'ステータスシャード3つ（offense, flex, defense）。detail_version 2 以降';
COMMENT ON COLUMN match_participants.skill_order IS 'スキル習得順（1=Q, 2=W, 3=E, 4=R）。タイムライン由来';
COMMENT ON COLUMN match_participants.starting_items IS '開始アイテム（試合開始60秒以内の購入。取り消しを反映）。タイムライン由来';
COMMENT ON COLUMN match_participants.completed_items IS '完成アイテムを完成順に並べたもの。タイムライン由来';
COMMENT ON COLUMN match_participants.patch IS 'パッチ（matches から非正規化）';
COMMENT ON COLUMN match_participants.is_remake IS 'リメイク（早期降伏）の試合か（matches から非正規化）';

-- ============================================================================
-- 3. 既存行の patch を game_version から補完
-- ============================================================================

-- game_version の先頭2要素（例: 16.22.123.4 → 16.22）。形式が合わない行は NULL のまま。
-- patch IS NULL の行だけを対象にするため、何度実行しても結果は同じ。
UPDATE matches
SET patch = substring(game_version from '^[0-9]+\.[0-9]+')
WHERE patch IS NULL;

UPDATE match_participants mp
SET patch = m.patch
FROM matches m
WHERE mp.match_id = m.match_id
  AND mp.patch IS NULL
  AND m.patch IS NOT NULL;

-- ============================================================================
-- 4. match_bans テーブル
-- ============================================================================

CREATE TABLE IF NOT EXISTS match_bans (
  match_id    text  NOT NULL REFERENCES matches(match_id) ON DELETE CASCADE,
  team_id     int   NOT NULL,
  pick_turn   int   NOT NULL,
  champion_id int   NOT NULL,
  PRIMARY KEY (match_id, team_id, pick_turn)
);

COMMENT ON TABLE match_bans IS '試合の BAN を保存するテーブル（1試合につき最大10行）';
COMMENT ON COLUMN match_bans.match_id IS '主キー（team_id, pick_turn と複合）、外部キー、matches.match_id';
COMMENT ON COLUMN match_bans.team_id IS '主キー（match_id, pick_turn と複合）、チームID（100 / 200）';
COMMENT ON COLUMN match_bans.pick_turn IS '主キー（match_id, team_id と複合）、BAN の順番';
COMMENT ON COLUMN match_bans.champion_id IS 'BAN されたチャンピオンID（BAN なしの -1 は保存しない）';

-- ============================================================================
-- 5. summoner_rank_snapshots テーブル
-- ============================================================================

CREATE TABLE IF NOT EXISTS summoner_rank_snapshots (
  puuid         text         NOT NULL,
  queue_type    text         NOT NULL,
  fetched_at    timestamptz  NOT NULL,
  region        text         NOT NULL,
  tier          text         NOT NULL,
  rank          text         NOT NULL,
  league_points int          NOT NULL,
  wins          int          NOT NULL,
  losses        int          NOT NULL,
  source        text         NOT NULL,
  PRIMARY KEY (puuid, queue_type, fetched_at)
);

COMMENT ON TABLE summoner_rank_snapshots IS 'サモナーのランクの記録（ランク帯での絞り込み用）。直前の記録と同一内容なら記録しない';
COMMENT ON COLUMN summoner_rank_snapshots.puuid IS '主キー（queue_type, fetched_at と複合）、Riot の PUUID';
COMMENT ON COLUMN summoner_rank_snapshots.queue_type IS '主キー（puuid, fetched_at と複合）、RANKED_SOLO_5x5 / RANKED_FLEX_SR';
COMMENT ON COLUMN summoner_rank_snapshots.fetched_at IS '主キー（puuid, queue_type と複合）、取得日時';
COMMENT ON COLUMN summoner_rank_snapshots.region IS 'リージョン';
COMMENT ON COLUMN summoner_rank_snapshots.tier IS 'ティア';
COMMENT ON COLUMN summoner_rank_snapshots.rank IS 'ランク';
COMMENT ON COLUMN summoner_rank_snapshots.league_points IS 'LP';
COMMENT ON COLUMN summoner_rank_snapshots.wins IS '勝利数';
COMMENT ON COLUMN summoner_rank_snapshots.losses IS '敗北数';
COMMENT ON COLUMN summoner_rank_snapshots.source IS '取得元（summoner_update、将来 crawler）';

-- ============================================================================
-- 6. インデックス
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_match_participants_champion_position_patch ON match_participants(champion_name, team_position, patch);

CREATE INDEX IF NOT EXISTS idx_match_bans_champion_id ON match_bans(champion_id);

CREATE INDEX IF NOT EXISTS idx_summoner_rank_snapshots_puuid_fetched_at ON summoner_rank_snapshots(puuid, fetched_at DESC);

-- 補完対象の抽出用（部分インデックス）
CREATE INDEX IF NOT EXISTS idx_matches_detail_outdated ON matches(game_end_at) WHERE detail_version < 2;

CREATE INDEX IF NOT EXISTS idx_matches_timeline_missing ON matches(game_end_at) WHERE timeline_fetched_at IS NULL;

COMMENT ON INDEX idx_match_participants_champion_position_patch IS 'チャンピオン・ロール・パッチ別のビルド集計を最適化';
COMMENT ON INDEX idx_match_bans_champion_id IS 'チャンピオンごとの BAN 率の集計を最適化';
COMMENT ON INDEX idx_summoner_rank_snapshots_puuid_fetched_at IS 'サモナーごとの最新ランクの取得を最適化';
COMMENT ON INDEX idx_matches_detail_outdated IS '試合詳細の再取り込み対象（detail_version が 2 未満）の抽出を最適化';
COMMENT ON INDEX idx_matches_timeline_missing IS 'タイムライン未取得の試合の抽出を最適化';

-- ============================================================================
-- 7. Row Level Security (RLS)
-- ============================================================================

ALTER TABLE match_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE summoner_rank_snapshots ENABLE ROW LEVEL SECURITY;

-- ポリシーは意図的に作成しない。
-- RLS を有効にしてポリシーがない場合、anon キー（フロントエンド）からのアクセスは全て拒否される。
-- これらのテーブルは service キーを使うバックエンドだけがアクセスする（service キーは RLS をバイパスする）。

-- ============================================================================
-- 8. Storage バケット（試合の生データ）
-- ============================================================================

-- 非公開バケット。パスは matches/{match_id}/detail.json.gz、matches/{match_id}/timeline.json.gz。
-- バケットのポリシーは作らない（service キーを使うバックエンドだけがアクセスする）。
INSERT INTO storage.buckets (id, name, public) VALUES ('riot-raw', 'riot-raw', false) ON CONFLICT (id) DO NOTHING;

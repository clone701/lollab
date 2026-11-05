-- Riot API データ用テーブル作成マイグレーション
-- 説明: summoner-search-api が使用する summoners / matches / match_participants / seasons テーブルの定義
--
-- 注意: summoners と match_participants の間に外部キーは張らない。
--       試合参加者のうち未登録のサモナーが多いため（puuid で結合のみ行う）。

-- ============================================================================
-- 1. summoners テーブル
-- ============================================================================

CREATE TABLE IF NOT EXISTS summoners (
  puuid               text         NOT NULL,
  region              text         NOT NULL,
  game_name           text         NOT NULL,
  tag_line            text         NOT NULL,
  riot_id_lower       text         NOT NULL,
  level               int          NOT NULL,
  profile_icon_id     int          NOT NULL,
  solo_tier           text         NOT NULL,
  solo_rank           text         NOT NULL,
  solo_lp             int          NOT NULL,
  solo_wins           int          NOT NULL,
  solo_losses         int          NOT NULL,
  rank_position       int,
  rank_total          int,
  rank_top_percent    numeric,
  last_updated_at     timestamptz  NOT NULL,
  synced_until        timestamptz,
  backfill_cursor     timestamptz,
  backfill_completed  boolean      NOT NULL DEFAULT false,
  backfill_started_at timestamptz,
  created_at          timestamptz  NOT NULL DEFAULT now(),
  PRIMARY KEY (puuid, region)
);

COMMENT ON TABLE summoners IS '検索・登録済みのサモナー（Riot アカウント）を保存するテーブル';
COMMENT ON COLUMN summoners.puuid IS '主キー（region と複合）、Riot の PUUID';
COMMENT ON COLUMN summoners.region IS '主キー（puuid と複合）、リージョン（JP / KR / NA / EUW / EUNE / OCE）';
COMMENT ON COLUMN summoners.game_name IS 'Riot ID のゲーム名（表示用）';
COMMENT ON COLUMN summoners.tag_line IS 'Riot ID のタグライン（表示用）';
COMMENT ON COLUMN summoners.riot_id_lower IS '`gamename#tagline` の小文字（検索用）';
COMMENT ON COLUMN summoners.level IS 'サモナーレベル';
COMMENT ON COLUMN summoners.profile_icon_id IS 'プロフィールアイコンID';
COMMENT ON COLUMN summoners.solo_tier IS 'ソロ/デュオのティア（UNRANKED を含む）';
COMMENT ON COLUMN summoners.solo_rank IS 'ソロ/デュオのランク（UNRANKED 時は空文字）';
COMMENT ON COLUMN summoners.solo_lp IS 'ソロ/デュオの LP';
COMMENT ON COLUMN summoners.solo_wins IS 'ソロ/デュオの勝利数';
COMMENT ON COLUMN summoners.solo_losses IS 'ソロ/デュオの敗北数';
COMMENT ON COLUMN summoners.rank_position IS '同ティア内の順位（不明時 NULL）';
COMMENT ON COLUMN summoners.rank_total IS '同ティア内の人数（不明時 NULL）';
COMMENT ON COLUMN summoners.rank_top_percent IS '全体での上位パーセント（ティア人口比からの概算、不明時 NULL）';
COMMENT ON COLUMN summoners.last_updated_at IS '最後に更新（同期部分）が完了した日時';
COMMENT ON COLUMN summoners.synced_until IS 'Backfill カーソル（新しい側）。この日時以降は欠けなく保存済み';
COMMENT ON COLUMN summoners.backfill_cursor IS 'Backfill カーソル（古い側）。この日時より新しい試合は欠けなく保存済み';
COMMENT ON COLUMN summoners.backfill_completed IS '古い側を履歴の最後まで取得済みか';
COMMENT ON COLUMN summoners.backfill_started_at IS 'Backfill の開始日時（二重実行防止）';
COMMENT ON COLUMN summoners.created_at IS '登録日時';

-- ============================================================================
-- 2. matches テーブル
-- ============================================================================

CREATE TABLE IF NOT EXISTS matches (
  match_id      text         PRIMARY KEY,
  queue_id      int          NOT NULL,
  game_mode     text         NOT NULL,
  game_version  text         NOT NULL,
  game_duration int          NOT NULL,
  game_end_at   timestamptz  NOT NULL,
  created_at    timestamptz  NOT NULL DEFAULT now()
);

COMMENT ON TABLE matches IS '試合の基本情報を保存するテーブル';
COMMENT ON COLUMN matches.match_id IS '主キー、試合ID（例: JP1_123456）';
COMMENT ON COLUMN matches.queue_id IS 'キューID（420 = ソロ/デュオ、440 = フレックス）';
COMMENT ON COLUMN matches.game_mode IS 'ゲームモード';
COMMENT ON COLUMN matches.game_version IS 'ゲームバージョン（例: 15.10.678.1234、パッチ別分析用）';
COMMENT ON COLUMN matches.game_duration IS '試合時間（秒）';
COMMENT ON COLUMN matches.game_end_at IS '試合終了日時';
COMMENT ON COLUMN matches.created_at IS 'レコード作成日時';

-- ============================================================================
-- 3. match_participants テーブル
-- ============================================================================

CREATE TABLE IF NOT EXISTS match_participants (
  match_id            text         NOT NULL REFERENCES matches(match_id) ON DELETE CASCADE,
  puuid               text         NOT NULL,
  riot_id_game_name   text,
  riot_id_tagline     text,
  team_id             int          NOT NULL,
  team_position       text         NOT NULL,
  champion_id         int          NOT NULL,
  champion_name       text         NOT NULL,
  win                 boolean      NOT NULL,
  kills               int          NOT NULL,
  deaths              int          NOT NULL,
  assists             int          NOT NULL,
  cs                  int          NOT NULL,
  gold_earned         int          NOT NULL,
  damage_to_champions int          NOT NULL,
  vision_score        int          NOT NULL,
  item_ids            int[]        NOT NULL,
  spell1_id           int          NOT NULL,
  spell2_id           int          NOT NULL,
  keystone_id         int          NOT NULL,
  primary_style_id    int          NOT NULL,
  sub_style_id        int          NOT NULL,
  queue_id            int          NOT NULL,
  game_end_at         timestamptz  NOT NULL,
  PRIMARY KEY (match_id, puuid)
);

COMMENT ON TABLE match_participants IS '試合参加者ごとの成績を保存するテーブル（1試合につき10行）';
COMMENT ON COLUMN match_participants.match_id IS '主キー（puuid と複合）、外部キー、matches.match_id';
COMMENT ON COLUMN match_participants.puuid IS '主キー（match_id と複合）、参加者の PUUID（summoners への外部キーは張らない）';
COMMENT ON COLUMN match_participants.riot_id_game_name IS '試合時点の Riot ID のゲーム名（試合詳細の表示用）';
COMMENT ON COLUMN match_participants.riot_id_tagline IS '試合時点の Riot ID のタグライン（試合詳細の表示用）';
COMMENT ON COLUMN match_participants.team_id IS 'チームID（100 / 200）';
COMMENT ON COLUMN match_participants.team_position IS 'ロール（TOP / JUNGLE / MIDDLE / BOTTOM / UTILITY、不明時は空文字）';
COMMENT ON COLUMN match_participants.champion_id IS 'チャンピオンID';
COMMENT ON COLUMN match_participants.champion_name IS 'チャンピオン名';
COMMENT ON COLUMN match_participants.win IS '勝利したか';
COMMENT ON COLUMN match_participants.kills IS 'キル数';
COMMENT ON COLUMN match_participants.deaths IS 'デス数';
COMMENT ON COLUMN match_participants.assists IS 'アシスト数';
COMMENT ON COLUMN match_participants.cs IS 'CS（ミニオン + 中立モンスター）';
COMMENT ON COLUMN match_participants.gold_earned IS '獲得ゴールド';
COMMENT ON COLUMN match_participants.damage_to_champions IS 'チャンピオンへのダメージ';
COMMENT ON COLUMN match_participants.vision_score IS 'ビジョンスコア';
COMMENT ON COLUMN match_participants.item_ids IS 'アイテムID配列（item0〜6）';
COMMENT ON COLUMN match_participants.spell1_id IS 'サモナースペル1のID';
COMMENT ON COLUMN match_participants.spell2_id IS 'サモナースペル2のID';
COMMENT ON COLUMN match_participants.keystone_id IS 'キーストーンのルーンID';
COMMENT ON COLUMN match_participants.primary_style_id IS 'メインルーンツリーID';
COMMENT ON COLUMN match_participants.sub_style_id IS 'サブルーンツリーID';
COMMENT ON COLUMN match_participants.queue_id IS 'キューID（matches から非正規化）';
COMMENT ON COLUMN match_participants.game_end_at IS '試合終了日時（matches から非正規化）';

-- ============================================================================
-- 4. seasons テーブル
-- ============================================================================

CREATE TABLE IF NOT EXISTS seasons (
  id       text         PRIMARY KEY,
  name     text         NOT NULL,
  start_at timestamptz  NOT NULL,
  end_at   timestamptz
);

COMMENT ON TABLE seasons IS 'シーズン期間の定義テーブル（Riot API に期間を返す API がないため手動登録）';
COMMENT ON COLUMN seasons.id IS '主キー、シーズンID（例: 2025-S1）';
COMMENT ON COLUMN seasons.name IS '表示名';
COMMENT ON COLUMN seasons.start_at IS 'シーズン開始日時（この日時以上）';
COMMENT ON COLUMN seasons.end_at IS 'シーズン終了日時（この日時未満、現行シーズンは NULL）';

-- ============================================================================
-- 5. インデックス
-- ============================================================================

-- RiotId は他人に再利用されることがあるため UNIQUE にしない
-- （同一 RiotId が複数ある場合は last_updated_at が新しい行を使う）
CREATE INDEX IF NOT EXISTS idx_summoners_region_riot_id_lower ON summoners(region, riot_id_lower);

CREATE INDEX IF NOT EXISTS idx_match_participants_puuid_game_end_at ON match_participants(puuid, game_end_at DESC);

CREATE INDEX IF NOT EXISTS idx_match_participants_champion_position ON match_participants(champion_id, team_position);

COMMENT ON INDEX idx_summoners_region_riot_id_lower IS 'リージョンと Riot ID によるサモナー検索を最適化';
COMMENT ON INDEX idx_match_participants_puuid_game_end_at IS 'サモナーごとの試合一覧・期間集計を最適化';
COMMENT ON INDEX idx_match_participants_champion_position IS 'チャンピオン・ロール別の分析を最適化';

-- ============================================================================
-- 6. Row Level Security (RLS)
-- ============================================================================

ALTER TABLE summoners ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;

-- ポリシーは意図的に作成しない。
-- RLS を有効にしてポリシーがない場合、anon キー（フロントエンド）からのアクセスは全て拒否される。
-- これらのテーブルは service キーを使うバックエンドだけがアクセスする（service キーは RLS をバイパスする）。

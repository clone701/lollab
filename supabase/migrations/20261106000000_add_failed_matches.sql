-- 取得失敗した試合の記録と flex 勝敗数の追加マイグレーション
-- 説明: Backfill で試合詳細の取得に失敗した試合を failed_matches に記録する。
--       また、更新時の変更検知（ソロ + フレックスの勝敗数合計の比較）のため、
--       summoners に flex_wins / flex_losses を追加する。
--
-- 注意: failed_matches と matches の間に外部キーは張らない。
--       取得に失敗した試合は matches に行がないため。

-- ============================================================================
-- 1. failed_matches テーブル
-- ============================================================================

CREATE TABLE IF NOT EXISTS failed_matches (
  match_id        text         PRIMARY KEY,
  attempts        int          NOT NULL DEFAULT 1,
  last_error      text,
  last_attempt_at timestamptz  NOT NULL DEFAULT now(),
  gave_up         boolean      NOT NULL DEFAULT false
);

COMMENT ON TABLE failed_matches IS 'Backfill で試合詳細の取得に失敗した試合を記録するテーブル（再取得と取得不能の判定用）';
COMMENT ON COLUMN failed_matches.match_id IS '主キー、試合ID（例: JP1_123456）';
COMMENT ON COLUMN failed_matches.attempts IS '失敗回数';
COMMENT ON COLUMN failed_matches.last_error IS '最後のエラー内容（ステータスコード等。機密情報は含めない）';
COMMENT ON COLUMN failed_matches.last_attempt_at IS '最後に取得を試みた日時';
COMMENT ON COLUMN failed_matches.gave_up IS '3回失敗して取得不能と判断したか';

-- ============================================================================
-- 2. summoners に flex 勝敗数を追加
-- ============================================================================

ALTER TABLE summoners ADD COLUMN IF NOT EXISTS flex_wins   int NOT NULL DEFAULT 0;
ALTER TABLE summoners ADD COLUMN IF NOT EXISTS flex_losses int NOT NULL DEFAULT 0;

COMMENT ON COLUMN summoners.flex_wins IS 'フレックスの勝利数（更新時の変更検知に使用）';
COMMENT ON COLUMN summoners.flex_losses IS 'フレックスの敗北数（更新時の変更検知に使用）';

-- ============================================================================
-- 3. Row Level Security (RLS)
-- ============================================================================

ALTER TABLE failed_matches ENABLE ROW LEVEL SECURITY;

-- ポリシーは意図的に作成しない。
-- RLS を有効にしてポリシーがない場合、anon キー（フロントエンド）からのアクセスは全て拒否される。
-- このテーブルは service キーを使うバックエンドだけがアクセスする（service キーは RLS をバイパスする）。

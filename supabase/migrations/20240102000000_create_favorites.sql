-- favorites テーブル作成マイグレーション
-- 説明: お気に入りサモナーを保存するテーブル
--
-- 注意: このファイルは稼働中のSupabaseから情報スキーマを吸い出して復元したものです。
--       元々マイグレーションが存在しなかったため、後追いで現状を記録しています。

-- ============================================================================
-- 1. favorites テーブル
-- ============================================================================

CREATE TABLE favorites (
  id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  summoner_name text         NOT NULL,
  tag_line      text         NOT NULL,
  region        text         NOT NULL,
  created_at    timestamptz  DEFAULT now(),
  CONSTRAINT favorites_user_id_summoner_name_tag_line_region_key
    UNIQUE (user_id, summoner_name, tag_line, region)
);

COMMENT ON TABLE favorites IS 'お気に入りサモナーを保存するテーブル';
COMMENT ON COLUMN favorites.id IS '主キー、UUID自動生成';
COMMENT ON COLUMN favorites.user_id IS '外部キー、auth.users.id';
COMMENT ON COLUMN favorites.summoner_name IS 'サモナー名（Riot ID のゲーム名部分）';
COMMENT ON COLUMN favorites.tag_line IS 'Riot ID のタグライン';
COMMENT ON COLUMN favorites.region IS 'リージョン（jp1, kr, na1 等）';
COMMENT ON COLUMN favorites.created_at IS '登録日時';
COMMENT ON CONSTRAINT favorites_user_id_summoner_name_tag_line_region_key ON favorites
  IS '同一ユーザーが同じサモナーを重複登録できないようにする';

-- ============================================================================
-- 2. インデックス
-- ============================================================================

CREATE INDEX idx_favorites_user_id ON favorites(user_id);

COMMENT ON INDEX idx_favorites_user_id IS 'ユーザーごとのお気に入り一覧取得を最適化';

-- ============================================================================
-- 3. Row Level Security (RLS) ポリシー
-- ============================================================================

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- SELECT ポリシー: ユーザーは自分のお気に入りのみ読み取り可能
CREATE POLICY "Users can view own favorites"
ON favorites
FOR SELECT
USING (auth.uid() = user_id);

-- INSERT ポリシー: ユーザーは自分のお気に入りのみ登録可能
CREATE POLICY "Users can insert own favorites"
ON favorites
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- DELETE ポリシー: ユーザーは自分のお気に入りのみ削除可能
CREATE POLICY "Users can delete own favorites"
ON favorites
FOR DELETE
USING (auth.uid() = user_id);

-- UPDATE ポリシーは意図的に存在しない。
-- favorites は登録と削除のみで、更新操作をアプリ側で行わないため
-- （frontend/src/adapters/supabase/favorites.ts, backend/api/favorites/router.py）。

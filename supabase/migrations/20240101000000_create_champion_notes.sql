-- champion_notes テーブル作成マイグレーション
-- 説明: マッチアップ別の戦略ノート（ルーン・アイテム・スペル・メモ）を保存するテーブル
--
-- 注意: このファイルは稼働中のSupabaseから情報スキーマを吸い出して復元したものです。
--       元々マイグレーションが存在しなかったため、後追いで現状を記録しています。

-- ============================================================================
-- 1. champion_notes テーブル
-- ============================================================================

CREATE TABLE champion_notes (
  id                bigserial    PRIMARY KEY,
  -- 実DBでは user_id が NULL 許容。general_notes / favorites は NOT NULL なので
  -- 設計上の不整合だが、既存行を壊さないため現状を維持している。
  user_id           uuid         REFERENCES auth.users(id) ON DELETE CASCADE,
  my_champion_id    text         NOT NULL,
  enemy_champion_id text         NOT NULL,
  preset_name       text         NOT NULL,
  runes             jsonb,
  items             jsonb,
  spells            jsonb,
  memo              text,
  created_at        timestamptz  DEFAULT now(),
  updated_at        timestamptz  DEFAULT now()
);

COMMENT ON TABLE champion_notes IS 'マッチアップ別の戦略ノートを保存するテーブル';
COMMENT ON COLUMN champion_notes.id IS '主キー、自動採番';
COMMENT ON COLUMN champion_notes.user_id IS '外部キー、auth.users.id';
COMMENT ON COLUMN champion_notes.my_champion_id IS '自分のチャンピオンID';
COMMENT ON COLUMN champion_notes.enemy_champion_id IS '相手のチャンピオンID';
COMMENT ON COLUMN champion_notes.preset_name IS 'プリセット名';
COMMENT ON COLUMN champion_notes.runes IS 'ルーン設定（JSON）';
COMMENT ON COLUMN champion_notes.items IS 'アイテム設定（JSON）';
COMMENT ON COLUMN champion_notes.spells IS 'サモナースペル設定（JSON）';
COMMENT ON COLUMN champion_notes.memo IS '戦略メモ';
COMMENT ON COLUMN champion_notes.created_at IS '作成日時';
COMMENT ON COLUMN champion_notes.updated_at IS '更新日時（アプリ層で明示的に更新）';

-- ============================================================================
-- 2. インデックス
-- ============================================================================

CREATE INDEX champion_notes_user_id_idx           ON champion_notes(user_id);
CREATE INDEX champion_notes_my_champion_id_idx    ON champion_notes(my_champion_id);
CREATE INDEX champion_notes_enemy_champion_id_idx ON champion_notes(enemy_champion_id);

-- ============================================================================
-- 3. Row Level Security (RLS) ポリシー
-- ============================================================================

ALTER TABLE champion_notes ENABLE ROW LEVEL SECURITY;

-- SELECT ポリシー: ユーザーは自分のノートのみ読み取り可能
CREATE POLICY "Users can view their own notes"
ON champion_notes
FOR SELECT
USING (auth.uid() = user_id);

-- INSERT ポリシー: ユーザーは自分のノートのみ作成可能
CREATE POLICY "Users can create their own notes"
ON champion_notes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE ポリシー: ユーザーは自分のノートのみ更新可能
CREATE POLICY "Users can update their own notes"
ON champion_notes
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE ポリシー: ユーザーは自分のノートのみ削除可能
CREATE POLICY "Users can delete their own notes"
ON champion_notes
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- 【意図的に再現していないポリシー】
-- ============================================================================
-- 稼働中のDBには以下のポリシーが存在していたが、ユーザー分離を無効化する
-- 危険な設定のため、このマイグレーションでは再現しない。
--
--   CREATE POLICY "allok" ON champion_notes FOR ALL USING (true) WITH CHECK (true);
--
-- PostgreSQLのpermissiveポリシーはOR結合されるため、上記が存在すると
-- 上の4ポリシーによる auth.uid() = user_id の絞り込みが実質無効になる。
-- 削除手順は 20240104000000_drop_champion_notes_allok_policy.sql を参照。

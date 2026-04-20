-- general_notes テーブル作成マイグレーション
-- 作成日: 2024-01-03
-- 説明: チャンピオンに紐付かない汎用ノート（General Note）テーブルの定義

-- ============================================================================
-- 1. general_notes テーブル
-- ============================================================================

CREATE TABLE general_notes (
  id         bigserial    PRIMARY KEY,
  user_id    uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      text         NOT NULL,
  body       text,
  tags       text[]       NOT NULL DEFAULT '{}',
  created_at timestamptz  NOT NULL DEFAULT now(),
  updated_at timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT tags_limit CHECK (
    array_length(tags, 1) IS NULL OR array_length(tags, 1) <= 10
  )
);

COMMENT ON TABLE general_notes IS 'チャンピオンに紐付かない自由なメモ（General Note）を保存するテーブル';
COMMENT ON COLUMN general_notes.id IS '主キー、自動採番';
COMMENT ON COLUMN general_notes.user_id IS '外部キー、app_users.id';
COMMENT ON COLUMN general_notes.title IS 'タイトル（最大100文字はアプリ層で検証）';
COMMENT ON COLUMN general_notes.body IS '本文（マークダウン、最大10,000文字はアプリ層で検証）';
COMMENT ON COLUMN general_notes.tags IS 'タグ配列（最大10個）';
COMMENT ON COLUMN general_notes.created_at IS '作成日時';
COMMENT ON COLUMN general_notes.updated_at IS '更新日時';

-- ============================================================================
-- 2. インデックス
-- ============================================================================

-- 一覧取得クエリ最適化（ユーザーごとの更新日時降順）
CREATE INDEX idx_general_notes_user_updated ON general_notes(user_id, updated_at DESC);

-- タグフィルタリング用GINインデックス
CREATE INDEX idx_general_notes_tags ON general_notes USING GIN(tags);

COMMENT ON INDEX idx_general_notes_user_updated IS 'ユーザーごとのノート一覧取得を最適化';
COMMENT ON INDEX idx_general_notes_tags IS 'タグによるフィルタリングを最適化';

-- ============================================================================
-- 3. Row Level Security (RLS) ポリシー
-- ============================================================================

ALTER TABLE general_notes ENABLE ROW LEVEL SECURITY;

-- SELECT ポリシー: ユーザーは自分のノートのみ読み取り可能
CREATE POLICY "Users can view their own general notes"
ON general_notes
FOR SELECT
USING (auth.uid() = user_id);

-- INSERT ポリシー: ユーザーは自分のノートのみ作成可能
CREATE POLICY "Users can create their own general notes"
ON general_notes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE ポリシー: ユーザーは自分のノートのみ更新可能
CREATE POLICY "Users can update their own general notes"
ON general_notes
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE ポリシー: ユーザーは自分のノートのみ削除可能
CREATE POLICY "Users can delete their own general notes"
ON general_notes
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- 4. 更新日時自動更新トリガー
-- ============================================================================

-- update_updated_at_column() 関数が未定義の場合は作成
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_general_notes_updated_at
BEFORE UPDATE ON general_notes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TRIGGER update_general_notes_updated_at ON general_notes IS 'general_notesのupdated_atを自動更新';

-- LoL Lab Database Schema Migration
-- 作成日: 2024-01-01
-- 説明: app_users、profiles、champion_notesテーブルの初期スキーマ定義

-- ============================================================================
-- 1. app_usersテーブル（Google認証ユーザー管理用）
-- ============================================================================

CREATE TABLE app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text,
  image text,
  provider text NOT NULL,
  provider_id text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(provider, provider_id)
);

-- app_usersテーブルのコメント
COMMENT ON TABLE app_users IS 'Google認証で得たユーザー情報を管理する独自テーブル';
COMMENT ON COLUMN app_users.id IS 'ユーザーID（主キー、自動生成）';
COMMENT ON COLUMN app_users.email IS 'メールアドレス';
COMMENT ON COLUMN app_users.name IS '表示名';
COMMENT ON COLUMN app_users.image IS 'アイコンURL';
COMMENT ON COLUMN app_users.provider IS '認証プロバイダー名（例: "google"）';
COMMENT ON COLUMN app_users.provider_id IS 'プロバイダー側のID（Google sub等）';
COMMENT ON COLUMN app_users.created_at IS '作成日時';

-- ============================================================================
-- 2. profilesテーブル（任意の追加プロフィール情報）
-- ============================================================================

CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
  display_name text,
  icon_url text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- profilesテーブルのコメント
COMMENT ON TABLE profiles IS 'ユーザーの追加プロフィール情報を保存（app_usersと1:1の関係）';
COMMENT ON COLUMN profiles.id IS '主キー、app_users.idへの外部キー';
COMMENT ON COLUMN profiles.display_name IS '表示名（任意）';
COMMENT ON COLUMN profiles.icon_url IS 'アイコンURL（任意）';
COMMENT ON COLUMN profiles.created_at IS '作成日時';

-- ============================================================================
-- 3. champion_notesテーブル（チャンピオン対策ノート）
-- ============================================================================

CREATE TABLE champion_notes (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  note_type text NOT NULL CHECK (note_type IN ('general', 'matchup')),
  my_champion_id text NOT NULL,
  enemy_champion_id text,
  runes jsonb,
  spells jsonb,
  items jsonb,
  memo text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CHECK (
    (note_type = 'matchup' AND enemy_champion_id IS NOT NULL) OR
    (note_type = 'general' AND enemy_champion_id IS NULL)
  )
);

-- champion_notesテーブルのコメント
COMMENT ON TABLE champion_notes IS 'チャンピオン戦略ノートを保存（汎用ノートと対策ノートの両方をサポート）';
COMMENT ON COLUMN champion_notes.id IS '主キー、自動採番';
COMMENT ON COLUMN champion_notes.user_id IS '外部キー、app_users.id';
COMMENT ON COLUMN champion_notes.note_type IS 'ノートタイプ（''general'' or ''matchup''）';
COMMENT ON COLUMN champion_notes.my_champion_id IS '自分のチャンピオンID（例: "Ahri"）';
COMMENT ON COLUMN champion_notes.enemy_champion_id IS '相手のチャンピオンID（matchupの場合必須）';
COMMENT ON COLUMN champion_notes.runes IS 'ルーン構成（JSON）';
COMMENT ON COLUMN champion_notes.spells IS 'サモナースペル（配列JSON）';
COMMENT ON COLUMN champion_notes.items IS '初期アイテム（配列JSON）';
COMMENT ON COLUMN champion_notes.memo IS '対策メモ';
COMMENT ON COLUMN champion_notes.created_at IS '作成日時';
COMMENT ON COLUMN champion_notes.updated_at IS '更新日時';

-- ============================================================================
-- 4. インデックス作成
-- ============================================================================

-- champion_notesテーブルのインデックス
CREATE INDEX idx_champion_notes_user_id ON champion_notes(user_id);
CREATE INDEX idx_champion_notes_my_champion_id ON champion_notes(my_champion_id);
CREATE INDEX idx_champion_notes_enemy_champion_id ON champion_notes(enemy_champion_id);
CREATE INDEX idx_champion_notes_note_type ON champion_notes(note_type);

COMMENT ON INDEX idx_champion_notes_user_id IS 'ユーザーごとのノート検索高速化';
COMMENT ON INDEX idx_champion_notes_my_champion_id IS 'チャンピオン検索最適化';
COMMENT ON INDEX idx_champion_notes_enemy_champion_id IS 'マッチアップ検索最適化';
COMMENT ON INDEX idx_champion_notes_note_type IS 'ノートタイプフィルタリング最適化';

-- ============================================================================
-- 5. Row Level Security (RLS) ポリシー
-- ============================================================================

-- app_usersテーブルのRLS有効化
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- app_users: SELECT ポリシー
CREATE POLICY "Users can view their own profile"
ON app_users
FOR SELECT
USING (auth.uid() = id);

-- app_users: UPDATE ポリシー
CREATE POLICY "Users can update their own profile"
ON app_users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- profilesテーブルのRLS有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- profiles: SELECT ポリシー
CREATE POLICY "Users can view their own profile"
ON profiles
FOR SELECT
USING (auth.uid() = id);

-- profiles: INSERT ポリシー
CREATE POLICY "Users can create their own profile"
ON profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- profiles: UPDATE ポリシー
CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- profiles: DELETE ポリシー
CREATE POLICY "Users can delete their own profile"
ON profiles
FOR DELETE
USING (auth.uid() = id);

-- champion_notesテーブルのRLS有効化
ALTER TABLE champion_notes ENABLE ROW LEVEL SECURITY;

-- champion_notes: SELECT ポリシー
CREATE POLICY "Users can view their own notes"
ON champion_notes
FOR SELECT
USING (auth.uid() = user_id);

-- champion_notes: INSERT ポリシー
CREATE POLICY "Users can create their own notes"
ON champion_notes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- champion_notes: UPDATE ポリシー
CREATE POLICY "Users can update their own notes"
ON champion_notes
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- champion_notes: DELETE ポリシー
CREATE POLICY "Users can delete their own notes"
ON champion_notes
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- 6. 更新日時自動更新トリガー
-- ============================================================================

-- updated_at自動更新関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- champion_notesテーブルにトリガーを設定
CREATE TRIGGER update_champion_notes_updated_at
BEFORE UPDATE ON champion_notes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

COMMENT ON FUNCTION update_updated_at_column() IS 'updated_atカラムを自動更新する関数';
COMMENT ON TRIGGER update_champion_notes_updated_at ON champion_notes IS 'champion_notesのupdated_atを自動更新';

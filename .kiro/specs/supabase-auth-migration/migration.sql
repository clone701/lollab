-- ============================================
-- Supabase Auth移行: データベーススキーマ変更
-- ============================================
-- 
-- 実行場所: Supabase Dashboard > SQL Editor
-- 
-- 警告: このスクリプトは既存データを削除します（開発環境のみ実行）
-- 本番環境では実行しないでください
--
-- ============================================

-- ステップ1: 既存データを削除（開発環境のみ）
-- champion_notesとprofilesテーブルの全データを削除
TRUNCATE TABLE champion_notes CASCADE;
TRUNCATE TABLE profiles CASCADE;

-- ステップ2: app_usersテーブルを削除
-- CASCADE: 依存する外部キー制約も自動的に削除される
DROP TABLE IF EXISTS app_users CASCADE;

-- ステップ3: champion_notesテーブルのuser_id外部キーをauth.usersに変更
-- 既存の外部キー制約を削除
ALTER TABLE champion_notes
DROP CONSTRAINT IF EXISTS champion_notes_user_id_fkey;

-- 新しい外部キー制約を追加（auth.usersテーブルを参照）
ALTER TABLE champion_notes
ADD CONSTRAINT champion_notes_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- ステップ4: profilesテーブルのid外部キーをauth.usersに変更
-- 既存の外部キー制約を削除
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 新しい外部キー制約を追加（auth.usersテーブルを参照）
ALTER TABLE profiles
ADD CONSTRAINT profiles_id_fkey
  FOREIGN KEY (id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- ============================================
-- 確認クエリ
-- ============================================

-- 外部キー制約の確認
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('champion_notes', 'profiles');

-- RLSポリシーの確認
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('champion_notes', 'profiles')
ORDER BY tablename, policyname;

-- ============================================
-- 注意事項
-- ============================================
--
-- 1. このスクリプトは開発環境でのみ実行してください
-- 2. 既存のchampion_notesとprofilesのデータは全て削除されます
-- 3. app_usersテーブルは完全に削除されます
-- 4. RLSポリシーは自動的に維持されます（auth.uid()がauth.usersを参照するため）
-- 5. 実行後、確認クエリで外部キー制約とRLSポリシーを確認してください
--
-- ============================================

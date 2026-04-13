-- ============================================================================
-- マイグレーション検証スクリプト
-- ============================================================================
-- このスクリプトは、マイグレーション実行後にデータベースの状態を検証します。
-- Supabase Dashboard の SQL Editor で実行してください。

-- ============================================================================
-- 1. テーブル作成の確認
-- ============================================================================

-- 期待される結果: app_users, profiles, champion_notes の3つのテーブルが表示される
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================================================
-- 2. テーブル構造の確認
-- ============================================================================

-- app_usersテーブルの構造
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'app_users'
ORDER BY ordinal_position;

-- profilesテーブルの構造
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- champion_notesテーブルの構造
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'champion_notes'
ORDER BY ordinal_position;

-- ============================================================================
-- 3. インデックスの確認
-- ============================================================================

-- 期待される結果: 各テーブルのインデックスが表示される
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================================================
-- 4. 制約の確認
-- ============================================================================

-- CHECK制約の確認
SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'CHECK'
ORDER BY tc.table_name, tc.constraint_name;

-- 外部キー制約の確認
SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- UNIQUE制約の確認
SELECT 
  tc.table_name,
  tc.constraint_name,
  string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) AS columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE'
  AND tc.table_schema = 'public'
GROUP BY tc.table_name, tc.constraint_name
ORDER BY tc.table_name;

-- ============================================================================
-- 5. Row Level Security (RLS) の確認
-- ============================================================================

-- RLS有効化の確認
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

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
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;

-- ============================================================================
-- 6. トリガーの確認
-- ============================================================================

-- トリガーの一覧
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- 7. 関数の確認
-- ============================================================================

-- update_updated_at_column関数の確認
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'update_updated_at_column';

-- ============================================================================
-- 8. コメントの確認
-- ============================================================================

-- テーブルコメントの確認
SELECT 
  c.relname AS table_name,
  pg_catalog.obj_description(c.oid, 'pg_class') AS table_comment
FROM pg_catalog.pg_class c
LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'r'
  AND n.nspname = 'public'
  AND c.relname IN ('app_users', 'profiles', 'champion_notes')
ORDER BY c.relname;

-- カラムコメントの確認（app_users）
SELECT 
  cols.column_name,
  pg_catalog.col_description(c.oid, cols.ordinal_position::int) AS column_comment
FROM information_schema.columns cols
JOIN pg_catalog.pg_class c ON c.relname = cols.table_name
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE cols.table_schema = 'public'
  AND cols.table_name = 'app_users'
  AND n.nspname = 'public'
ORDER BY cols.ordinal_position;

-- カラムコメントの確認（champion_notes）
SELECT 
  cols.column_name,
  pg_catalog.col_description(c.oid, cols.ordinal_position::int) AS column_comment
FROM information_schema.columns cols
JOIN pg_catalog.pg_class c ON c.relname = cols.table_name
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE cols.table_schema = 'public'
  AND cols.table_name = 'champion_notes'
  AND n.nspname = 'public'
ORDER BY cols.ordinal_position;

-- ============================================================================
-- 9. サマリー情報
-- ============================================================================

-- テーブル数の確認
SELECT 
  'Tables' AS object_type,
  COUNT(*) AS count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'

UNION ALL

-- インデックス数の確認
SELECT 
  'Indexes' AS object_type,
  COUNT(*) AS count
FROM pg_indexes
WHERE schemaname = 'public'

UNION ALL

-- RLSポリシー数の確認
SELECT 
  'RLS Policies' AS object_type,
  COUNT(*) AS count
FROM pg_policies
WHERE schemaname = 'public'

UNION ALL

-- トリガー数の確認
SELECT 
  'Triggers' AS object_type,
  COUNT(*) AS count
FROM information_schema.triggers
WHERE trigger_schema = 'public'

UNION ALL

-- 関数数の確認
SELECT 
  'Functions' AS object_type,
  COUNT(*) AS count
FROM information_schema.routines
WHERE routine_schema = 'public';

-- ============================================================================
-- 検証完了
-- ============================================================================
-- 上記のクエリ結果を確認し、期待される結果と一致することを確認してください。
-- 詳細な期待値は migration-execution-guide.md を参照してください。

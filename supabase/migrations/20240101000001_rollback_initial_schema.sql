-- LoL Lab Database Schema Rollback Migration
-- 作成日: 2024-01-01
-- 説明: 初期スキーマのロールバック用SQLファイル

-- ============================================================================
-- ロールバック手順
-- ============================================================================
-- このファイルは初期スキーマ（20240101000000_initial_schema.sql）を
-- ロールバックするために使用します。
-- 
-- 警告: このスクリプトを実行すると、全てのデータが削除されます！
-- ============================================================================

-- 1. トリガーの削除
DROP TRIGGER IF EXISTS update_champion_notes_updated_at ON champion_notes;

-- 2. 関数の削除
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 3. テーブルの削除（外部キー制約の順序を考慮）
DROP TABLE IF EXISTS champion_notes CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS app_users CASCADE;

-- 4. 確認メッセージ
DO $$
BEGIN
  RAISE NOTICE 'ロールバック完了: app_users, profiles, champion_notesテーブルが削除されました';
END $$;

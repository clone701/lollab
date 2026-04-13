-- LoL Lab Database Migration: Add note_type Column
-- 作成日: 2024-01-02
-- 説明: 既存のchampion_notesテーブルにnote_type列を追加するマイグレーション
-- 
-- このマイグレーションは、初期スキーマ作成前にchampion_notesテーブルが
-- 存在していた場合に使用します。
-- 
-- 注意: 初期スキーマ（20240101000000_initial_schema.sql）を使用して
-- テーブルを作成した場合、このマイグレーションは不要です。

-- ============================================================================
-- 前提条件チェック
-- ============================================================================

-- champion_notesテーブルが存在し、note_type列が存在しないことを確認
DO $
BEGIN
  -- テーブルが存在しない場合はエラー
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'champion_notes'
  ) THEN
    RAISE EXCEPTION 'champion_notesテーブルが存在しません。このマイグレーションは既存テーブルの更新用です。';
  END IF;

  -- note_type列が既に存在する場合はスキップ
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'champion_notes' 
    AND column_name = 'note_type'
  ) THEN
    RAISE NOTICE 'note_type列は既に存在します。このマイグレーションをスキップします。';
    RETURN;
  END IF;
END
$;

-- ============================================================================
-- Step 1: note_type列を追加（デフォルト値'matchup'）
-- ============================================================================

-- 既存のレコードは全て対策ノート（matchup）として扱う
ALTER TABLE champion_notes 
ADD COLUMN IF NOT EXISTS note_type text DEFAULT 'matchup' NOT NULL;

COMMENT ON COLUMN champion_notes.note_type IS 'ノートタイプ（''general'' or ''matchup''）';

-- ============================================================================
-- Step 2: CHECK制約を追加
-- ============================================================================

-- note_typeの値を'general'または'matchup'に制限
ALTER TABLE champion_notes 
ADD CONSTRAINT IF NOT EXISTS check_note_type 
CHECK (note_type IN ('general', 'matchup'));

-- ============================================================================
-- Step 3: enemy_champion_id整合性CHECK制約を追加
-- ============================================================================

-- note_typeとenemy_champion_idの整合性を保証
-- - matchupの場合: enemy_champion_idは必須
-- - generalの場合: enemy_champion_idはNULL
ALTER TABLE champion_notes 
ADD CONSTRAINT IF NOT EXISTS check_enemy_champion_id 
CHECK (
  (note_type = 'matchup' AND enemy_champion_id IS NOT NULL) OR
  (note_type = 'general' AND enemy_champion_id IS NULL)
);

-- ============================================================================
-- Step 4: インデックスを追加
-- ============================================================================

-- note_type列にインデックスを作成（ノートタイプフィルタリング最適化）
CREATE INDEX IF NOT EXISTS idx_champion_notes_note_type 
ON champion_notes(note_type);

COMMENT ON INDEX idx_champion_notes_note_type IS 'ノートタイプフィルタリング最適化';

-- ============================================================================
-- Step 5: 既存データの整合性を検証
-- ============================================================================

-- 既存データがCHECK制約に違反していないか確認
DO $
DECLARE
  invalid_count int;
BEGIN
  -- note_type='matchup'でenemy_champion_idがNULLのレコードをカウント
  SELECT COUNT(*) INTO invalid_count
  FROM champion_notes 
  WHERE note_type = 'matchup' AND enemy_champion_id IS NULL;

  IF invalid_count > 0 THEN
    RAISE WARNING '警告: % 件のレコードがnote_type=''matchup''でenemy_champion_id=NULLです。', invalid_count;
    RAISE WARNING 'これらのレコードは手動で修正する必要があります。';
    
    -- 問題のあるレコードを表示
    RAISE NOTICE '問題のあるレコードID:';
    FOR invalid_count IN 
      SELECT id FROM champion_notes 
      WHERE note_type = 'matchup' AND enemy_champion_id IS NULL
      LIMIT 10
    LOOP
      RAISE NOTICE '  - ID: %', invalid_count;
    END LOOP;
  ELSE
    RAISE NOTICE '✓ 既存データの整合性チェック完了: 問題なし';
  END IF;
END
$;

-- ============================================================================
-- Step 6: マイグレーション完了メッセージ
-- ============================================================================

DO $
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'マイグレーション完了: note_type列の追加';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ note_type列を追加（デフォルト値: matchup）';
  RAISE NOTICE '✓ CHECK制約を追加（note_type IN (''general'', ''matchup'')）';
  RAISE NOTICE '✓ CHECK制約を追加（enemy_champion_id整合性）';
  RAISE NOTICE '✓ インデックスを追加（idx_champion_notes_note_type）';
  RAISE NOTICE '✓ 既存データの整合性を検証';
  RAISE NOTICE '========================================';
END
$;

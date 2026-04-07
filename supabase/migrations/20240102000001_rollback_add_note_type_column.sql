-- LoL Lab Database Migration Rollback: Remove note_type Column
-- 作成日: 2024-01-02
-- 説明: note_type列追加マイグレーション（20240102000000）のロールバック
-- 
-- このスクリプトは、note_type列の追加を元に戻します。
-- 
-- 警告: このロールバックを実行すると、note_type='general'のノートが
-- 不整合な状態になる可能性があります（enemy_champion_id=NULLのまま）。

-- ============================================================================
-- 前提条件チェック
-- ============================================================================

DO $
BEGIN
  -- champion_notesテーブルが存在することを確認
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'champion_notes'
  ) THEN
    RAISE EXCEPTION 'champion_notesテーブルが存在しません。';
  END IF;

  -- note_type列が存在することを確認
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'champion_notes' 
    AND column_name = 'note_type'
  ) THEN
    RAISE NOTICE 'note_type列は存在しません。ロールバックをスキップします。';
    RETURN;
  END IF;
END
$;

-- ============================================================================
-- Step 1: 汎用ノート（general）の存在確認
-- ============================================================================

DO $
DECLARE
  general_count int;
BEGIN
  -- note_type='general'のレコード数をカウント
  SELECT COUNT(*) INTO general_count
  FROM champion_notes 
  WHERE note_type = 'general';

  IF general_count > 0 THEN
    RAISE WARNING '警告: % 件の汎用ノート（note_type=''general''）が存在します。', general_count;
    RAISE WARNING 'ロールバック後、これらのノートはenemy_champion_id=NULLのままになります。';
    RAISE WARNING 'データの整合性を保つため、ロールバック前にこれらのノートを削除または更新することを推奨します。';
  ELSE
    RAISE NOTICE '✓ 汎用ノートは存在しません。ロールバックを続行します。';
  END IF;
END
$;

-- ============================================================================
-- Step 2: インデックスを削除
-- ============================================================================

DROP INDEX IF EXISTS idx_champion_notes_note_type;

RAISE NOTICE '✓ インデックス削除: idx_champion_notes_note_type';

-- ============================================================================
-- Step 3: CHECK制約を削除
-- ============================================================================

-- enemy_champion_id整合性CHECK制約を削除
ALTER TABLE champion_notes 
DROP CONSTRAINT IF EXISTS check_enemy_champion_id;

RAISE NOTICE '✓ CHECK制約削除: check_enemy_champion_id';

-- note_type値CHECK制約を削除
ALTER TABLE champion_notes 
DROP CONSTRAINT IF EXISTS check_note_type;

RAISE NOTICE '✓ CHECK制約削除: check_note_type';

-- ============================================================================
-- Step 4: note_type列を削除
-- ============================================================================

ALTER TABLE champion_notes 
DROP COLUMN IF EXISTS note_type;

RAISE NOTICE '✓ note_type列を削除';

-- ============================================================================
-- Step 5: ロールバック完了メッセージ
-- ============================================================================

DO $
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ロールバック完了: note_type列の削除';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ インデックスを削除（idx_champion_notes_note_type）';
  RAISE NOTICE '✓ CHECK制約を削除（check_enemy_champion_id）';
  RAISE NOTICE '✓ CHECK制約を削除（check_note_type）';
  RAISE NOTICE '✓ note_type列を削除';
  RAISE NOTICE '========================================';
  RAISE NOTICE '注意: 汎用ノート（旧note_type=''general''）が存在した場合、';
  RAISE NOTICE '      enemy_champion_id=NULLのレコードが残っている可能性があります。';
  RAISE NOTICE '========================================';
END
$;

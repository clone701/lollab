-- LoL Lab Database: note_type列追加マイグレーション検証スクリプト
-- 作成日: 2024-01-02
-- 説明: 20240102000000_add_note_type_column.sql の実行結果を検証

-- ============================================================================
-- 検証1: note_type列の存在確認
-- ============================================================================

SELECT 
  '検証1: note_type列の存在確認' AS test_name,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'champion_notes' 
        AND column_name = 'note_type'
    ) THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS result,
  'note_type列が存在すること' AS expected;

-- ============================================================================
-- 検証2: note_type列の定義確認
-- ============================================================================

SELECT 
  '検証2: note_type列の定義確認' AS test_name,
  CASE 
    WHEN column_name = 'note_type' 
     AND data_type = 'text' 
     AND is_nullable = 'NO' 
     AND column_default = '''matchup''::text'
    THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS result,
  'note_type列がtext型、NOT NULL、デフォルト値''matchup''であること' AS expected
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'champion_notes'
  AND column_name = 'note_type';

-- ============================================================================
-- 検証3: CHECK制約（note_type）の存在確認
-- ============================================================================

SELECT 
  '検証3: CHECK制約（note_type）の存在確認' AS test_name,
  CASE 
    WHEN EXISTS (
      SELECT FROM pg_constraint
      WHERE conrelid = 'champion_notes'::regclass
        AND contype = 'c'
        AND conname = 'check_note_type'
    ) THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS result,
  'check_note_type制約が存在すること' AS expected;

-- ============================================================================
-- 検証4: CHECK制約（enemy_champion_id）の存在確認
-- ============================================================================

SELECT 
  '検証4: CHECK制約（enemy_champion_id）の存在確認' AS test_name,
  CASE 
    WHEN EXISTS (
      SELECT FROM pg_constraint
      WHERE conrelid = 'champion_notes'::regclass
        AND contype = 'c'
        AND conname = 'check_enemy_champion_id'
    ) THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS result,
  'check_enemy_champion_id制約が存在すること' AS expected;

-- ============================================================================
-- 検証5: インデックスの存在確認
-- ============================================================================

SELECT 
  '検証5: インデックスの存在確認' AS test_name,
  CASE 
    WHEN EXISTS (
      SELECT FROM pg_indexes
      WHERE tablename = 'champion_notes'
        AND indexname = 'idx_champion_notes_note_type'
    ) THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS result,
  'idx_champion_notes_note_typeインデックスが存在すること' AS expected;

-- ============================================================================
-- 検証6: 既存データのnote_type値確認
-- ============================================================================

SELECT 
  '検証6: 既存データのnote_type値確認' AS test_name,
  CASE 
    WHEN COUNT(*) = 0 OR MIN(note_type) IN ('general', 'matchup')
    THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS result,
  '全てのレコードのnote_typeが''general''または''matchup''であること' AS expected
FROM champion_notes;

-- ============================================================================
-- 検証7: データ整合性確認（matchup + NULL enemy）
-- ============================================================================

SELECT 
  '検証7: データ整合性確認（matchup + NULL enemy）' AS test_name,
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ PASS'
    ELSE '✗ FAIL (' || COUNT(*) || '件の不整合)'
  END AS result,
  'note_type=''matchup''でenemy_champion_id=NULLのレコードが存在しないこと' AS expected
FROM champion_notes 
WHERE note_type = 'matchup' AND enemy_champion_id IS NULL;

-- ============================================================================
-- 検証8: データ整合性確認（general + NOT NULL enemy）
-- ============================================================================

SELECT 
  '検証8: データ整合性確認（general + NOT NULL enemy）' AS test_name,
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ PASS'
    ELSE '✗ FAIL (' || COUNT(*) || '件の不整合)'
  END AS result,
  'note_type=''general''でenemy_champion_id!=NULLのレコードが存在しないこと' AS expected
FROM champion_notes 
WHERE note_type = 'general' AND enemy_champion_id IS NOT NULL;

-- ============================================================================
-- 検証サマリー
-- ============================================================================

SELECT 
  '========================================' AS separator
UNION ALL
SELECT 'マイグレーション検証サマリー'
UNION ALL
SELECT '========================================'
UNION ALL
SELECT 
  'テーブル: champion_notes'
UNION ALL
SELECT 
  'レコード数: ' || COUNT(*)::text
FROM champion_notes
UNION ALL
SELECT 
  'note_type=''matchup'': ' || COUNT(*)::text
FROM champion_notes WHERE note_type = 'matchup'
UNION ALL
SELECT 
  'note_type=''general'': ' || COUNT(*)::text
FROM champion_notes WHERE note_type = 'general'
UNION ALL
SELECT '========================================';

-- ============================================================================
-- 詳細情報: note_type列の定義
-- ============================================================================

SELECT 
  '詳細情報: note_type列の定義' AS section,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'champion_notes'
  AND column_name = 'note_type';

-- ============================================================================
-- 詳細情報: CHECK制約の定義
-- ============================================================================

SELECT 
  '詳細情報: CHECK制約の定義' AS section,
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'champion_notes'::regclass
  AND contype = 'c'
  AND conname IN ('check_note_type', 'check_enemy_champion_id')
ORDER BY conname;

-- ============================================================================
-- 詳細情報: インデックスの定義
-- ============================================================================

SELECT 
  '詳細情報: インデックスの定義' AS section,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'champion_notes'
  AND indexname = 'idx_champion_notes_note_type';

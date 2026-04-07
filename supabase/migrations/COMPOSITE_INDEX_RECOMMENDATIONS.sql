-- ============================================================================
-- 複合インデックス推奨スクリプト
-- ============================================================================
-- 
-- このファイルは、パフォーマンス最適化のための複合インデックスの推奨事項を含みます。
-- 必須インデックスは既に20240101000000_initial_schema.sqlで作成済みです。
-- 
-- 実装タイミング: アプリケーションの使用パターンを監視した後、必要に応じて実装
-- 
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 優先度: 最高 ⭐⭐⭐⭐⭐
-- 推奨実装時期: 短期（1-3ヶ月）
-- ----------------------------------------------------------------------------

-- 提案1: ユーザー + 自分のチャンピオン検索
-- 用途: ユーザーが特定のチャンピオンのノートを検索する際のパフォーマンス向上
-- 想定クエリ: SELECT * FROM champion_notes WHERE user_id = ? AND my_champion_id = ?
CREATE INDEX IF NOT EXISTS idx_champion_notes_user_my_champion 
ON champion_notes(user_id, my_champion_id);

COMMENT ON INDEX idx_champion_notes_user_my_champion IS 'ユーザー + チャンピオン検索の最適化';

-- ----------------------------------------------------------------------------
-- 優先度: 高 ⭐⭐⭐⭐
-- 推奨実装時期: 短期（1-3ヶ月）
-- ----------------------------------------------------------------------------

-- 提案4: ユーザー + 更新日時ソート
-- 用途: ユーザーのノート一覧を更新日時順で表示する際のパフォーマンス向上
-- 想定クエリ: SELECT * FROM champion_notes WHERE user_id = ? ORDER BY updated_at DESC LIMIT 100
CREATE INDEX IF NOT EXISTS idx_champion_notes_user_updated 
ON champion_notes(user_id, updated_at DESC);

COMMENT ON INDEX idx_champion_notes_user_updated IS 'ユーザーのノート一覧表示（更新日時順）の最適化';

-- ----------------------------------------------------------------------------
-- 優先度: 高 ⭐⭐⭐⭐
-- 推奨実装時期: 中期（3-6ヶ月）
-- ----------------------------------------------------------------------------

-- 提案2: ユーザー + マッチアップ検索
-- 用途: 特定のマッチアップノートを検索する際のパフォーマンス向上
-- 想定クエリ: SELECT * FROM champion_notes WHERE user_id = ? AND my_champion_id = ? AND enemy_champion_id = ?
CREATE INDEX IF NOT EXISTS idx_champion_notes_user_matchup 
ON champion_notes(user_id, my_champion_id, enemy_champion_id);

COMMENT ON INDEX idx_champion_notes_user_matchup IS 'マッチアップ検索の最適化';

-- ----------------------------------------------------------------------------
-- 優先度: 中 ⭐⭐⭐
-- 推奨実装時期: 中期（3-6ヶ月）
-- ----------------------------------------------------------------------------

-- 提案3: ユーザー + ノートタイプ検索
-- 用途: ユーザーが汎用ノートまたは対策ノートのみを表示する際のパフォーマンス向上
-- 想定クエリ: SELECT * FROM champion_notes WHERE user_id = ? AND note_type = 'general'
CREATE INDEX IF NOT EXISTS idx_champion_notes_user_note_type 
ON champion_notes(user_id, note_type);

COMMENT ON INDEX idx_champion_notes_user_note_type IS 'ノートタイプフィルタリングの最適化';

-- ============================================================================
-- パフォーマンステストクエリ
-- ============================================================================

-- これらのクエリを使用して、インデックスのパフォーマンスを測定してください。
-- 目標: 200ms以内（要件6.5）

-- テスト1: ユーザーのノート一覧取得
-- EXPLAIN ANALYZE
-- SELECT * FROM champion_notes 
-- WHERE user_id = 'test-uuid-here' 
-- ORDER BY updated_at DESC 
-- LIMIT 100;

-- テスト2: 特定チャンピオンのノート検索
-- EXPLAIN ANALYZE
-- SELECT * FROM champion_notes 
-- WHERE user_id = 'test-uuid-here' AND my_champion_id = 'Ahri';

-- テスト3: マッチアップノート検索
-- EXPLAIN ANALYZE
-- SELECT * FROM champion_notes 
-- WHERE user_id = 'test-uuid-here' 
--   AND my_champion_id = 'Ahri' 
--   AND enemy_champion_id = 'Yasuo';

-- テスト4: ノートタイプフィルタリング
-- EXPLAIN ANALYZE
-- SELECT * FROM champion_notes 
-- WHERE user_id = 'test-uuid-here' AND note_type = 'general';

-- ============================================================================
-- ロールバックスクリプト（必要に応じて使用）
-- ============================================================================

-- DROP INDEX IF EXISTS idx_champion_notes_user_my_champion;
-- DROP INDEX IF EXISTS idx_champion_notes_user_updated;
-- DROP INDEX IF EXISTS idx_champion_notes_user_matchup;
-- DROP INDEX IF EXISTS idx_champion_notes_user_note_type;

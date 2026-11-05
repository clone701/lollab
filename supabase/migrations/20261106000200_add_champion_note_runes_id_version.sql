-- 対策ノートに runes_id_version 列を追加するマイグレーション（ルーン ID 移行の第1段階）
-- 説明: champion_notes.runes がどの ID 体系で保存されたかを区別する列を追加する（1 = 旧、2 = Riot の値）。
--       新しいフロントエンドは保存時にこの列へ 2 を書き込むため、デプロイ前に必ず適用する。
--       旧フロントエンドはこの列を書かないため既定値 1 になり、第2段階（20261106000300）で変換される。
--
-- 【適用手順】
--   1. このファイルを実行する（旧フロントエンドのままでよい）
--   2. 新しいフロントエンドをデプロイする
--   3. 20261106000300_migrate_champion_note_rune_ids.sql を実行する
-- ============================================================================
-- 1. champion_notes に runes_id_version を追加
-- ============================================================================

ALTER TABLE champion_notes ADD COLUMN IF NOT EXISTS runes_id_version int NOT NULL DEFAULT 1;

COMMENT ON COLUMN champion_notes.runes_id_version IS 'runes の ID 体系の版。1 = 旧、2 = Riot（Data Dragon）の ID。保存時にアプリ層が 2 を書き込む';

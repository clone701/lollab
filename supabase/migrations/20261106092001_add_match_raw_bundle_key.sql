-- matches に raw_bundle_key を追加（match-detail）
-- 説明: クローラーは生データを1起動分まとめたファイル（bundles/crawler/...）に保存する。
--       試合詳細を表示するときにどのファイルを読めばよいか分かるよう、試合ごとにキーを記録する。
--       検索・Backfill の試合（1試合1ファイル）は NULL のまま。
--
-- 注意: 何度実行しても同じ結果になる。既存の行は変更しない。

-- ============================================================================
-- 1. raw_bundle_key 列
-- ============================================================================
ALTER TABLE matches ADD COLUMN IF NOT EXISTS raw_bundle_key text;
COMMENT ON COLUMN matches.raw_bundle_key IS 'クローラーが保存した生データのまとめファイルのキー（bundles/crawler/...）。1試合1ファイルで保存した試合は NULL';
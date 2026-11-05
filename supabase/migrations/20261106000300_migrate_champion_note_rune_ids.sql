-- 対策ノートのルーン ID を Riot（Data Dragon）の値に移行するマイグレーション
-- 説明: champion_notes.runes に保存している ID は、一部が Riot の値とずれていた。
--       フロントエンド（runes.ts）の修正に合わせて、保存済みの ID を Riot の値に書き換える。
--       どの ID 体系で保存されたかを runes_id_version で区別する（1 = 旧、2 = Riot の値）。
--
-- 【適用手順】
--   1. 20261106000200_add_champion_note_runes_id_version.sql を実行する
--   2. 新しいフロントエンドをデプロイする
--   3. このファイルを実行する（デプロイ後。旧画面で保存された version 1 の行も変換される）
--   何度実行しても runes_id_version = 2 の行は変わらない。
--
-- 【戻し方】（バックアップから runes を戻し、version を 1 にする）
--   UPDATE champion_notes n
--   SET runes = b.runes, runes_id_version = 1
--   FROM champion_notes_runes_backup b
--   WHERE n.id = b.note_id;
--   ※ 旧フロントエンドに戻したうえで実行すること。
--   ※ 変換後に新画面で編集・保存したノートも、バックアップ時点の runes に戻る。
--
-- 変換対応表（旧 → 新）。置き換えは連鎖するため、1回の参照で同時に変換する。
--   パス（primaryPath / secondaryPath）: 8300 → 8400、8400 → 8300
--   ルーン（keystone / primaryRunes / secondaryRunes）:
--     8124 → 8128、8128 → 9923、8136 → 8137、8120 → 8140、8138 → 8141、8134 → 8106、
--     8358 → 8242、8345 → 8313、8313 → 8352、8347 → 8345、8316 → 8347、8352 → 8316
--   シャード（shards の 3 番目 = defense のみ）: 5001 → 5011、5002 → 5013、5003 → 5001

-- 第1段階（20261106000200）が未適用でも動くよう、列の追加をここでも行う（冪等）
ALTER TABLE champion_notes ADD COLUMN IF NOT EXISTS runes_id_version int NOT NULL DEFAULT 1;

-- ============================================================================
-- 2. バックアップテーブル
-- ============================================================================

CREATE TABLE IF NOT EXISTS champion_notes_runes_backup (
  note_id      bigint       PRIMARY KEY,
  runes        jsonb,
  backed_up_at timestamptz  DEFAULT now()
);

COMMENT ON TABLE champion_notes_runes_backup IS 'ルーン ID 移行前の champion_notes.runes の退避先（戻し用）';
COMMENT ON COLUMN champion_notes_runes_backup.note_id IS '主キー、champion_notes.id（外部キーは張らない。ノートが削除されても残す）';
COMMENT ON COLUMN champion_notes_runes_backup.runes IS '移行前の runes（旧 ID）';
COMMENT ON COLUMN champion_notes_runes_backup.backed_up_at IS '退避日時';

ALTER TABLE champion_notes_runes_backup ENABLE ROW LEVEL SECURITY;

-- ポリシーは意図的に作成しない。
-- RLS を有効にしてポリシーがない場合、anon キー（フロントエンド）からのアクセスは全て拒否される。
-- 運用者が SQL Editor からだけ操作する。

-- 未変換（runes_id_version = 1）の行を退避する。既に退避済みの行は上書きしない。
INSERT INTO champion_notes_runes_backup (note_id, runes)
SELECT id, runes
FROM champion_notes
WHERE runes_id_version = 1
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 3. 変換関数
-- ============================================================================

-- 各 ID は対応表を 1 回参照するだけで変換する（変換後の値を再度変換しない）。
-- キーが無い・null・型が違う場合はそのまま返す。
CREATE OR REPLACE FUNCTION lollab_remap_rune_ids(p_runes jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  path_map  constant jsonb := '{"8300": 8400, "8400": 8300}';
  rune_map  constant jsonb := '{"8124": 8128, "8128": 9923, "8136": 8137, "8120": 8140, "8138": 8141, "8134": 8106, "8358": 8242, "8345": 8313, "8313": 8352, "8347": 8345, "8316": 8347, "8352": 8316}';
  shard_map constant jsonb := '{"5001": 5011, "5002": 5013, "5003": 5001}';
  result    jsonb := p_runes;
  k         text;
BEGIN
  IF p_runes IS NULL OR jsonb_typeof(p_runes) <> 'object' THEN
    RETURN p_runes;
  END IF;

  -- パス
  FOREACH k IN ARRAY ARRAY['primaryPath', 'secondaryPath'] LOOP
    IF jsonb_typeof(result -> k) = 'number' THEN
      result := jsonb_set(result, ARRAY[k], COALESCE(path_map -> (result ->> k), result -> k));
    END IF;
  END LOOP;

  -- キーストーン
  IF jsonb_typeof(result -> 'keystone') = 'number' THEN
    result := jsonb_set(result, '{keystone}', COALESCE(rune_map -> (result ->> 'keystone'), result -> 'keystone'));
  END IF;

  -- メインルーン・サブルーン
  FOREACH k IN ARRAY ARRAY['primaryRunes', 'secondaryRunes'] LOOP
    IF jsonb_typeof(result -> k) = 'array' THEN
      result := jsonb_set(
        result,
        ARRAY[k],
        (
          SELECT COALESCE(
            jsonb_agg(
              CASE WHEN jsonb_typeof(t.e) = 'number'
                THEN COALESCE(rune_map -> (t.e #>> '{}'), t.e)
                ELSE t.e
              END
              ORDER BY t.ord
            ),
            '[]'::jsonb
          )
          FROM jsonb_array_elements(result -> k) WITH ORDINALITY AS t(e, ord)
        )
      );
    END IF;
  END LOOP;

  -- シャード: 3 番目（defense）のみ。offense / flex は変更なし
  IF jsonb_typeof(result -> 'shards') = 'array'
     AND jsonb_array_length(result -> 'shards') >= 3
     AND jsonb_typeof(result -> 'shards' -> 2) = 'number' THEN
    result := jsonb_set(
      result,
      '{shards,2}',
      COALESCE(shard_map -> (result -> 'shards' ->> 2), result -> 'shards' -> 2)
    );
  END IF;

  RETURN result;
END;
$$;

COMMENT ON FUNCTION lollab_remap_rune_ids(jsonb) IS '対策ノートの runes（JSON）の旧ルーン ID を Riot（Data Dragon）の ID に変換する。ルーン ID 移行用';

-- ============================================================================
-- 4. 未変換のノートを変換
-- ============================================================================

-- runes が NULL の行は version だけ 2 にする（lollab_remap_rune_ids は NULL をそのまま返す）。
-- runes_id_version = 2 の行は対象外のため、何度実行しても結果は同じ。
UPDATE champion_notes
SET runes = lollab_remap_rune_ids(runes),
    runes_id_version = 2
WHERE runes_id_version = 1;

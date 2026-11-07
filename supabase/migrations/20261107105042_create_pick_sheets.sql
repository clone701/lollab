-- マイピック（my-pick）の表とピックの作成
-- 説明: レーンごとに「相手チャンピオン → 自分が出すチャンピオン（順番付き、最大10）」を
--       まとめた表を、ユーザーが何枚でも作れるようにする。ブラウザから直接読み書きし、
--       RLS で本人のデータだけに限る。
--       - pick_sheets: 表（名前・レーン）
--       - pick_sheet_entries: 相手チャンピオン1体につき1行のピック
--
-- 注意: 何度実行しても同じ結果になる。update_updated_at_column() は general_notes の
--       マイグレーション（20240103000000）で作成済みのものを使う（ここでも CREATE OR REPLACE する）。

-- ============================================================================
-- 1. pick_sheets テーブル
-- ============================================================================
CREATE TABLE IF NOT EXISTS pick_sheets (
  id          bigserial    PRIMARY KEY,
  user_id     uuid         NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text         NOT NULL CHECK (char_length(name) BETWEEN 1 AND 50),
  lane        text         NOT NULL CHECK (lane IN ('TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY')),
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now()
);
COMMENT ON TABLE pick_sheets IS 'マイピック表（レーンごとの相手→自分のピックの表）';
COMMENT ON COLUMN pick_sheets.id IS '主キー';
COMMENT ON COLUMN pick_sheets.user_id IS '持ち主（auth.users）';
COMMENT ON COLUMN pick_sheets.name IS '表の名前（1〜50文字）';
COMMENT ON COLUMN pick_sheets.lane IS 'レーン（TOP / JUNGLE / MIDDLE / BOTTOM / UTILITY）';
COMMENT ON COLUMN pick_sheets.created_at IS '作成日時';
COMMENT ON COLUMN pick_sheets.updated_at IS '更新日時（トリガーで自動更新）';

CREATE INDEX IF NOT EXISTS idx_pick_sheets_user_updated
  ON pick_sheets (user_id, updated_at DESC);

-- ============================================================================
-- 2. pick_sheet_entries テーブル
-- ============================================================================
CREATE TABLE IF NOT EXISTS pick_sheet_entries (
  sheet_id           bigint  NOT NULL REFERENCES pick_sheets(id) ON DELETE CASCADE,
  enemy_champion_id  text    NOT NULL,
  user_id            uuid    NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  pick_champion_ids  text[]  NOT NULL CHECK (cardinality(pick_champion_ids) BETWEEN 1 AND 10),
  PRIMARY KEY (sheet_id, enemy_champion_id)
);
COMMENT ON TABLE pick_sheet_entries IS 'マイピックのピック（相手チャンピオン1体につき1行）';
COMMENT ON COLUMN pick_sheet_entries.sheet_id IS '表（pick_sheets）。表を削除すると一緒に消える';
COMMENT ON COLUMN pick_sheet_entries.enemy_champion_id IS '相手チャンピオンの id（例: Ahri。champion_notes と同じ）';
COMMENT ON COLUMN pick_sheet_entries.user_id IS '持ち主（RLS の判定用。表の持ち主と同じ）';
COMMENT ON COLUMN pick_sheet_entries.pick_champion_ids IS '自分のピック（順番どおり、1〜10体。重複なしはアプリ層で検証）';

-- ============================================================================
-- 3. Row Level Security (RLS)
-- ============================================================================
ALTER TABLE pick_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE pick_sheet_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own pick sheets" ON pick_sheets;
CREATE POLICY "Users can view their own pick sheets"
  ON pick_sheets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own pick sheets" ON pick_sheets;
CREATE POLICY "Users can create their own pick sheets"
  ON pick_sheets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own pick sheets" ON pick_sheets;
CREATE POLICY "Users can update their own pick sheets"
  ON pick_sheets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own pick sheets" ON pick_sheets;
CREATE POLICY "Users can delete their own pick sheets"
  ON pick_sheets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own pick entries" ON pick_sheet_entries;
CREATE POLICY "Users can view their own pick entries"
  ON pick_sheet_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 他人の表にピックを足せないよう、表の持ち主が本人であることも確かめる
DROP POLICY IF EXISTS "Users can create entries in their own pick sheets" ON pick_sheet_entries;
CREATE POLICY "Users can create entries in their own pick sheets"
  ON pick_sheet_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM pick_sheets s
      WHERE s.id = pick_sheet_entries.sheet_id AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own pick entries" ON pick_sheet_entries;
CREATE POLICY "Users can update their own pick entries"
  ON pick_sheet_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM pick_sheets s
      WHERE s.id = pick_sheet_entries.sheet_id AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own pick entries" ON pick_sheet_entries;
CREATE POLICY "Users can delete their own pick entries"
  ON pick_sheet_entries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. updated_at の自動更新
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_pick_sheets_updated_at ON pick_sheets;
CREATE TRIGGER update_pick_sheets_updated_at
  BEFORE UPDATE ON pick_sheets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
COMMENT ON TRIGGER update_pick_sheets_updated_at ON pick_sheets IS 'pick_sheetsのupdated_atを自動更新';

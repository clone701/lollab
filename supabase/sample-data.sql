-- ============================================================================
-- サンプルデータ挿入スクリプト
-- ============================================================================
-- このスクリプトは、アプリケーションの動作確認用のサンプルデータを挿入します。
-- Supabase Dashboard の SQL Editor で実行してください。
-- 注意: このスクリプトはサービスキーを使用して実行する必要があります。

-- ============================================================================
-- 1. テストユーザーの作成
-- ============================================================================

-- テストユーザーA
INSERT INTO app_users (id, email, name, image, provider, provider_id)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'test-user-a@example.com',
  'Test User A',
  'https://via.placeholder.com/150',
  'google',
  'google-test-id-a'
)
ON CONFLICT (provider, provider_id) DO NOTHING;

-- テストユーザーB
INSERT INTO app_users (id, email, name, image, provider, provider_id)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'test-user-b@example.com',
  'Test User B',
  'https://via.placeholder.com/150',
  'google',
  'google-test-id-b'
)
ON CONFLICT (provider, provider_id) DO NOTHING;

-- ============================================================================
-- 2. プロフィール情報の作成（任意）
-- ============================================================================

-- ユーザーAのプロフィール
INSERT INTO profiles (id, display_name, icon_url)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'TestUserA',
  'https://via.placeholder.com/150'
)
ON CONFLICT (id) DO NOTHING;

-- ユーザーBのプロフィール
INSERT INTO profiles (id, display_name, icon_url)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'TestUserB',
  'https://via.placeholder.com/150'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. チャンピオンノートのサンプルデータ
-- ============================================================================

-- ユーザーAの汎用ノート（Ahri）
INSERT INTO champion_notes (
  user_id,
  note_type,
  my_champion_id,
  enemy_champion_id,
  runes,
  spells,
  items,
  memo
)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'general',
  'Ahri',
  NULL,
  '{
    "primaryPath": 8100,
    "secondaryPath": 8200,
    "keystone": 8112,
    "primaryRunes": [8126, 8138, 8135],
    "secondaryRunes": [9111, 9104],
    "shards": [5008, 5008, 5002]
  }'::jsonb,
  '["SummonerFlash", "SummonerIgnite"]'::jsonb,
  '["1055", "2003"]'::jsonb,
  '基本的なビルドとプレイスタイル。序盤はファームを優先し、レベル6以降にロームを狙う。'
);

-- ユーザーAの対策ノート（Ahri vs Yasuo）
INSERT INTO champion_notes (
  user_id,
  note_type,
  my_champion_id,
  enemy_champion_id,
  runes,
  spells,
  items,
  memo
)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'matchup',
  'Ahri',
  'Yasuo',
  '{
    "primaryPath": 8100,
    "secondaryPath": 8300,
    "keystone": 8112,
    "primaryRunes": [8126, 8138, 8135],
    "secondaryRunes": [8304, 8345],
    "shards": [5008, 5008, 5002]
  }'::jsonb,
  '["SummonerFlash", "SummonerExhaust"]'::jsonb,
  '["1056", "2003"]'::jsonb,
  'Yasuoのウィンドウォールに注意。Eでハラスしてから距離を取る。レベル3以降はオールインに注意。Exhaustを温存してYasuoのウルトに合わせる。'
);

-- ユーザーAの対策ノート（Ahri vs Zed）
INSERT INTO champion_notes (
  user_id,
  note_type,
  my_champion_id,
  enemy_champion_id,
  runes,
  spells,
  items,
  memo
)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'matchup',
  'Ahri',
  'Zed',
  '{
    "primaryPath": 8100,
    "secondaryPath": 8300,
    "keystone": 8112,
    "primaryRunes": [8126, 8138, 8135],
    "secondaryRunes": [8304, 8345],
    "shards": [5008, 5008, 5002]
  }'::jsonb,
  '["SummonerFlash", "SummonerBarrier"]'::jsonb,
  '["1056", "2003", "2055"]'::jsonb,
  'Zedのウルトに対してRを温存。レベル6以前にハラスを入れてヘルスアドバンテージを取る。Seekers Armguardを早めに積む。'
);

-- ユーザーBの汎用ノート（Zed）
INSERT INTO champion_notes (
  user_id,
  note_type,
  my_champion_id,
  enemy_champion_id,
  runes,
  spells,
  items,
  memo
)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'general',
  'Zed',
  NULL,
  '{
    "primaryPath": 8100,
    "secondaryPath": 8300,
    "keystone": 8112,
    "primaryRunes": [8126, 8138, 8135],
    "secondaryRunes": [8304, 8345],
    "shards": [5008, 5008, 5002]
  }'::jsonb,
  '["SummonerFlash", "SummonerIgnite"]'::jsonb,
  '["1036", "2003"]'::jsonb,
  'アグレッシブなプレイスタイル。レベル3でオールインを狙う。ウルトのタイミングが重要。'
);

-- ユーザーBの対策ノート（Zed vs Ahri）
INSERT INTO champion_notes (
  user_id,
  note_type,
  my_champion_id,
  enemy_champion_id,
  runes,
  spells,
  items,
  memo
)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'matchup',
  'Zed',
  'Ahri',
  '{
    "primaryPath": 8100,
    "secondaryPath": 8300,
    "keystone": 8112,
    "primaryRunes": [8126, 8138, 8135],
    "secondaryRunes": [8304, 8345],
    "shards": [5008, 5008, 5002]
  }'::jsonb,
  '["SummonerFlash", "SummonerIgnite"]'::jsonb,
  '["1036", "2003"]'::jsonb,
  'AhriのチャームをWで避ける。ウルトを使った後が狙い目。レベル6以降はロームで差をつける。'
);

-- ユーザーBの対策ノート（Zed vs Yasuo）
INSERT INTO champion_notes (
  user_id,
  note_type,
  my_champion_id,
  enemy_champion_id,
  runes,
  spells,
  items,
  memo
)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'matchup',
  'Zed',
  'Yasuo',
  '{
    "primaryPath": 8100,
    "secondaryPath": 8300,
    "keystone": 8112,
    "primaryRunes": [8126, 8138, 8135],
    "secondaryRunes": [8304, 8345],
    "shards": [5008, 5008, 5002]
  }'::jsonb,
  '["SummonerFlash", "SummonerIgnite"]'::jsonb,
  '["1036", "2003"]'::jsonb,
  'ウィンドウォールのクールダウンを把握。Qをウィンドウォールで防がれないように注意。レベル2-3でトレードを仕掛ける。'
);

-- ============================================================================
-- 4. データ確認
-- ============================================================================

-- 挿入されたユーザー数を確認
SELECT 'app_users' AS table_name, COUNT(*) AS count FROM app_users
UNION ALL
SELECT 'profiles' AS table_name, COUNT(*) AS count FROM profiles
UNION ALL
SELECT 'champion_notes' AS table_name, COUNT(*) AS count FROM champion_notes;

-- ユーザーごとのノート数を確認
SELECT 
  u.email,
  COUNT(cn.id) AS note_count,
  SUM(CASE WHEN cn.note_type = 'general' THEN 1 ELSE 0 END) AS general_notes,
  SUM(CASE WHEN cn.note_type = 'matchup' THEN 1 ELSE 0 END) AS matchup_notes
FROM app_users u
LEFT JOIN champion_notes cn ON u.id = cn.user_id
GROUP BY u.email
ORDER BY u.email;

-- チャンピオン別のノート数を確認
SELECT 
  my_champion_id,
  note_type,
  COUNT(*) AS count
FROM champion_notes
GROUP BY my_champion_id, note_type
ORDER BY my_champion_id, note_type;

-- ============================================================================
-- サンプルデータ挿入完了
-- ============================================================================
-- 上記のクエリ結果を確認し、期待されるデータが挿入されたことを確認してください。
-- 
-- 期待される結果:
-- - app_users: 2件
-- - profiles: 2件
-- - champion_notes: 6件
--   - ユーザーA: 3件（汎用1件、対策2件）
--   - ユーザーB: 3件（汎用1件、対策2件）

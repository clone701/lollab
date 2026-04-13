# データベースマイグレーション手順

## 概要

`champion_notes`テーブルに`preset_name`カラムを追加するマイグレーション手順です。

## Supabaseでの実行方法

### 方法1: Supabase Dashboard（推奨）

1. **Supabase Dashboardにアクセス**
   - https://supabase.com/dashboard にアクセス
   - プロジェクトを選択

2. **SQL Editorを開く**
   - 左サイドバーから「SQL Editor」をクリック
   - 「New query」をクリック

3. **以下のSQLを実行**

```sql
-- preset_nameカラムを追加
ALTER TABLE champion_notes 
ADD COLUMN preset_name text NOT NULL DEFAULT '未設定';

-- デフォルト値を削除（今後はNOT NULL制約のみ）
ALTER TABLE champion_notes 
ALTER COLUMN preset_name DROP DEFAULT;
```

4. **実行確認**
   - 「Run」ボタンをクリック
   - 成功メッセージを確認

5. **テーブル構造を確認**

```sql
-- テーブル構造を確認
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'champion_notes'
ORDER BY ordinal_position;
```

期待される結果:
```
column_name         | data_type                   | is_nullable | column_default
--------------------+-----------------------------+-------------+---------------
id                  | bigint                      | NO          | nextval(...)
user_id             | uuid                        | NO          | 
my_champion_id      | text                        | NO          | 
enemy_champion_id   | text                        | NO          | 
preset_name         | text                        | NO          | 
runes               | jsonb                       | YES         | 
spells              | jsonb                       | YES         | 
items               | jsonb                       | YES         | 
memo                | text                        | YES         | 
created_at          | timestamp with time zone    | NO          | now()
updated_at          | timestamp with time zone    | NO          | now()
```

### 方法2: ローカルSupabase CLI（開発環境）

1. **マイグレーションファイルを作成**

```bash
# Supabase CLIがインストールされている場合
supabase migration new add_preset_name_to_champion_notes
```

2. **生成されたマイグレーションファイルに以下を記述**

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_add_preset_name_to_champion_notes.sql

-- preset_nameカラムを追加
ALTER TABLE champion_notes 
ADD COLUMN preset_name text NOT NULL DEFAULT '未設定';

-- デフォルト値を削除
ALTER TABLE champion_notes 
ALTER COLUMN preset_name DROP DEFAULT;
```

3. **マイグレーションを実行**

```bash
# ローカル環境に適用
supabase db push

# 本番環境に適用
supabase db push --linked
```

## 既存データの対応

既存のデータがある場合、以下のSQLで`preset_name`を更新できます：

```sql
-- 既存データにデフォルトのプリセット名を設定
UPDATE champion_notes
SET preset_name = 'プリセット ' || id
WHERE preset_name = '未設定';
```

または、より意味のある名前を設定：

```sql
-- マッチアップ情報からプリセット名を生成
UPDATE champion_notes
SET preset_name = my_champion_id || ' vs ' || enemy_champion_id
WHERE preset_name = '未設定';
```

## ロールバック方法

万が一、カラムを削除する必要がある場合：

```sql
-- preset_nameカラムを削除（注意: データが失われます）
ALTER TABLE champion_notes 
DROP COLUMN preset_name;
```

## 確認事項

マイグレーション後、以下を確認してください：

1. **テーブル構造の確認**
   ```sql
   \d champion_notes
   ```

2. **既存データの確認**
   ```sql
   SELECT id, preset_name, my_champion_id, enemy_champion_id
   FROM champion_notes
   LIMIT 5;
   ```

3. **INSERT操作のテスト**
   ```sql
   -- テストデータを挿入
   INSERT INTO champion_notes (
     user_id, 
     my_champion_id, 
     enemy_champion_id, 
     preset_name
   ) VALUES (
     'your-user-id-here',
     'Ahri',
     'Yasuo',
     '序盤安定型'
   );
   ```

## トラブルシューティング

### エラー: "column contains null values"

既存データに`NULL`が含まれている場合、以下の手順で対応：

```sql
-- 1. まずNULL許可でカラムを追加
ALTER TABLE champion_notes 
ADD COLUMN preset_name text;

-- 2. 既存データにデフォルト値を設定
UPDATE champion_notes
SET preset_name = 'プリセット ' || id
WHERE preset_name IS NULL;

-- 3. NOT NULL制約を追加
ALTER TABLE champion_notes 
ALTER COLUMN preset_name SET NOT NULL;
```

### エラー: "permission denied"

RLSポリシーが原因の場合、一時的に無効化：

```sql
-- RLSを一時的に無効化（マイグレーション中のみ）
ALTER TABLE champion_notes DISABLE ROW LEVEL SECURITY;

-- マイグレーション実行

-- RLSを再度有効化
ALTER TABLE champion_notes ENABLE ROW LEVEL SECURITY;
```

## 注意事項

- **本番環境での実行前に、必ずバックアップを取得してください**
- **ステージング環境で事前にテストすることを推奨します**
- **マイグレーション中はアプリケーションを一時停止することを検討してください**

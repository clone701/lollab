# note_type列追加マイグレーションガイド

## 概要

このドキュメントは、既存の`champion_notes`テーブルに`note_type`列を追加するマイグレーション（`20240102000000_add_note_type_column.sql`）の実行手順と検証方法を説明します。

## 適用対象

このマイグレーションは、以下の条件に該当する場合に**のみ**実行してください：

- ✅ `champion_notes`テーブルが既に存在する
- ✅ `note_type`列が存在しない（古いスキーマを使用している）
- ✅ 既存のノートデータを保持したい

## 適用不要なケース

以下の場合、このマイグレーションは**不要**です：

- ❌ 初期スキーマ（`20240101000000_initial_schema.sql`）を使用してテーブルを作成した場合
  - 初期スキーマには既に`note_type`列が含まれています
- ❌ `champion_notes`テーブルがまだ存在しない場合
  - 初期スキーマを使用して新規作成してください

## マイグレーション内容

### 実行される変更

1. **note_type列の追加**
   - 型: `text`
   - デフォルト値: `'matchup'`
   - 制約: `NOT NULL`
   - 既存のレコードは全て`'matchup'`として扱われます

2. **CHECK制約の追加**
   - `check_note_type`: `note_type IN ('general', 'matchup')`
   - `check_enemy_champion_id`: note_typeとenemy_champion_idの整合性を保証

3. **インデックスの追加**
   - `idx_champion_notes_note_type`: ノートタイプフィルタリング最適化

4. **既存データの整合性検証**
   - `note_type='matchup'`でenemy_champion_idがNULLのレコードをチェック
   - 問題があれば警告メッセージを表示

## 実行前の準備

### 1. データベースバックアップ

```sql
-- 既存データのバックアップ（推奨）
CREATE TABLE champion_notes_backup AS 
SELECT * FROM champion_notes;
```

### 2. 現在のスキーマ確認

```sql
-- champion_notesテーブルの列を確認
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'champion_notes'
ORDER BY ordinal_position;

-- note_type列が存在しないことを確認
SELECT EXISTS (
  SELECT FROM information_schema.columns 
  WHERE table_schema = 'public' 
    AND table_name = 'champion_notes' 
    AND column_name = 'note_type'
) AS note_type_exists;
-- 結果がfalseであることを確認
```

### 3. 既存データの確認

```sql
-- 既存のレコード数を確認
SELECT COUNT(*) AS total_notes FROM champion_notes;

-- enemy_champion_idがNULLのレコード数を確認
SELECT COUNT(*) AS null_enemy_count 
FROM champion_notes 
WHERE enemy_champion_id IS NULL;
```

## マイグレーション実行方法

### 方法1: Supabase Dashboard（推奨）

1. **Supabaseダッシュボードにログイン**
   - https://app.supabase.com/ にアクセス
   - プロジェクトを選択

2. **SQL Editorを開く**
   - 左メニューから「SQL Editor」を選択
   - 「New query」をクリック

3. **マイグレーションスクリプトを実行**
   - `supabase/migrations/20240102000000_add_note_type_column.sql` の内容をコピー
   - SQL Editorにペースト
   - 「Run」ボタンをクリック

4. **実行結果を確認**
   - エラーがないことを確認
   - NOTICEメッセージで完了を確認

### 方法2: Supabase CLI

```bash
# マイグレーションファイルを適用
supabase db push

# または、特定のマイグレーションを実行
psql $DATABASE_URL -f supabase/migrations/20240102000000_add_note_type_column.sql
```

## マイグレーション検証

### 1. note_type列の確認

```sql
-- note_type列が追加されたことを確認
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'champion_notes'
  AND column_name = 'note_type';

-- 期待される結果:
-- column_name | data_type | is_nullable | column_default
-- ------------+-----------+-------------+----------------
-- note_type   | text      | NO          | 'matchup'::text
```

### 2. CHECK制約の確認

```sql
-- CHECK制約が追加されたことを確認
SELECT conname, pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'champion_notes'::regclass
  AND contype = 'c'
  AND conname IN ('check_note_type', 'check_enemy_champion_id');

-- 期待される結果:
-- conname                  | constraint_definition
-- -------------------------+-------------------------------------------------------
-- check_note_type          | CHECK ((note_type = ANY (ARRAY['general', 'matchup'])))
-- check_enemy_champion_id  | CHECK (((note_type = 'matchup' AND enemy_champion_id IS NOT NULL) OR (note_type = 'general' AND enemy_champion_id IS NULL)))
```

### 3. インデックスの確認

```sql
-- インデックスが追加されたことを確認
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'champion_notes'
  AND indexname = 'idx_champion_notes_note_type';

-- 期待される結果:
-- indexname                    | indexdef
-- -----------------------------+--------------------------------------------------
-- idx_champion_notes_note_type | CREATE INDEX idx_champion_notes_note_type ON public.champion_notes USING btree (note_type)
```

### 4. 既存データの確認

```sql
-- 既存のレコードがnote_type='matchup'になっていることを確認
SELECT note_type, COUNT(*) AS count
FROM champion_notes
GROUP BY note_type;

-- 期待される結果（既存データが全て'matchup'）:
-- note_type | count
-- ----------+-------
-- matchup   | <既存のレコード数>
```

### 5. データ整合性の確認

```sql
-- CHECK制約に違反するレコードがないことを確認
SELECT COUNT(*) AS invalid_count
FROM champion_notes 
WHERE (note_type = 'matchup' AND enemy_champion_id IS NULL)
   OR (note_type = 'general' AND enemy_champion_id IS NOT NULL);

-- 期待される結果:
-- invalid_count
-- --------------
-- 0
```

## トラブルシューティング

### エラー: "champion_notesテーブルが存在しません"

**原因:** テーブルがまだ作成されていない

**解決方法:**
- 初期スキーマ（`20240101000000_initial_schema.sql`）を先に実行してください
- このマイグレーションは既存テーブルの更新用です

### エラー: "note_type列は既に存在します"

**原因:** note_type列が既に追加されている

**解決方法:**
- このマイグレーションは不要です
- スクリプトは自動的にスキップされます

### 警告: "X 件のレコードがnote_type='matchup'でenemy_champion_id=NULLです"

**原因:** データの整合性に問題がある

**解決方法:**
```sql
-- 問題のあるレコードを確認
SELECT id, my_champion_id, enemy_champion_id, note_type
FROM champion_notes 
WHERE note_type = 'matchup' AND enemy_champion_id IS NULL;

-- オプション1: 汎用ノートに変更
UPDATE champion_notes 
SET note_type = 'general'
WHERE note_type = 'matchup' AND enemy_champion_id IS NULL;

-- オプション2: レコードを削除
DELETE FROM champion_notes 
WHERE note_type = 'matchup' AND enemy_champion_id IS NULL;

-- オプション3: enemy_champion_idを設定
UPDATE champion_notes 
SET enemy_champion_id = '<適切なチャンピオンID>'
WHERE id = <問題のあるレコードID>;
```

## ロールバック方法

マイグレーションを元に戻す必要がある場合：

```sql
-- ロールバックスクリプトを実行
-- supabase/migrations/20240102000001_rollback_add_note_type_column.sql
```

**警告:** ロールバックを実行すると、`note_type='general'`のノートが不整合な状態になる可能性があります。

## 次のステップ

マイグレーションが成功したら：

1. **アプリケーションコードの更新**
   - ノート作成時に`note_type`を指定するように更新
   - 汎用ノート（`note_type='general'`）の作成機能を実装

2. **既存データの確認**
   - 全てのノートが正しく`note_type='matchup'`になっているか確認
   - 必要に応じて汎用ノートに変更

3. **パフォーマンステスト**
   - `note_type`でのフィルタリングが高速に動作することを確認

## 関連ドキュメント

- `.kiro/specs/note-database-design/design.md`: データベース設計書
- `.kiro/specs/note-database-design/requirements.md`: 要件定義書（要件8, 9）
- `supabase/migrations/20240101000000_initial_schema.sql`: 初期スキーマ
- `supabase/migrations/20240102000001_rollback_add_note_type_column.sql`: ロールバックスクリプト

## 注意事項

- このマイグレーションは、既存のデータを保持したまま`note_type`列を追加します
- 既存のレコードは全て`note_type='matchup'`として扱われます
- 汎用ノート機能を使用する場合は、アプリケーション側で`note_type='general'`を指定してください
- マイグレーション実行前に必ずバックアップを取得してください

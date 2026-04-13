# マイグレーション実行ガイド

## 概要

このドキュメントは、LoL Labのデータベーススキーママイグレーション（`20240101000000_initial_schema.sql`）の実行手順と検証方法を説明します。

## 前提条件

- Supabaseプロジェクトが作成済みであること
- Supabaseダッシュボードへのアクセス権限があること
- または、Supabase CLIがインストール済みであること

## マイグレーション実行方法

### 方法1: Supabase Dashboard（推奨）

#### 手順

1. **Supabaseダッシュボードにログイン**
   - https://app.supabase.com/ にアクセス
   - プロジェクトを選択

2. **SQL Editorを開く**
   - 左メニューから「SQL Editor」を選択
   - 「New query」をクリック

3. **マイグレーションスクリプトを実行**
   - `supabase/migrations/20240101000000_initial_schema.sql` の内容をコピー
   - SQL Editorにペースト
   - 「Run」ボタンをクリック

4. **実行結果を確認**
   - エラーがないことを確認
   - 「Success. No rows returned」と表示されればOK

#### 注意事項

- スクリプトは複数のステートメントを含むため、全体を一度に実行してください
- エラーが発生した場合は、エラーメッセージを確認し、問題を解決してから再実行してください

### 方法2: Supabase CLI

#### 前提条件

```bash
# Supabase CLIのインストール（初回のみ）
npm install -g supabase

# プロジェクトの初期化（初回のみ）
supabase init
```

#### 手順

```bash
# ローカル開発環境の起動
supabase start

# マイグレーションの適用
supabase db push

# 本番環境への適用（プロジェクトをリンク済みの場合）
supabase db push --linked
```

## マイグレーション検証

マイグレーション実行後、以下の検証スクリプトを実行して、すべてが正しく作成されたことを確認してください。

### 検証スクリプトの実行

1. Supabase Dashboard の SQL Editor を開く
2. `supabase/verification-scripts.sql` の内容をコピー
3. SQL Editorにペーストして実行
4. 各検証項目の結果を確認

### 期待される結果

#### 1. テーブル作成の確認

**期待される出力:**
```
table_name
--------------
app_users
profiles
champion_notes
```

#### 2. インデックス作成の確認

**期待される出力:**
```
indexname                              | tablename
---------------------------------------+---------------
idx_champion_notes_user_id            | champion_notes
idx_champion_notes_my_champion_id     | champion_notes
idx_champion_notes_enemy_champion_id  | champion_notes
idx_champion_notes_note_type          | champion_notes
app_users_provider_provider_id_key    | app_users
```

#### 3. RLSポリシーの確認

**期待される出力:**
```
tablename      | policyname                           | cmd
---------------+--------------------------------------+--------
app_users      | Users can view their own profile     | SELECT
app_users      | Users can update their own profile   | UPDATE
profiles       | Users can view their own profile     | SELECT
profiles       | Users can create their own profile   | INSERT
profiles       | Users can update their own profile   | UPDATE
profiles       | Users can delete their own profile   | DELETE
champion_notes | Users can view their own notes       | SELECT
champion_notes | Users can create their own notes     | INSERT
champion_notes | Users can update their own notes     | UPDATE
champion_notes | Users can delete their own notes     | DELETE
```

#### 4. トリガーの確認

**期待される出力:**
```
trigger_name                        | event_manipulation | action_statement
------------------------------------+--------------------+------------------
update_champion_notes_updated_at   | UPDATE             | EXECUTE FUNCTION update_updated_at_column()
```

## トラブルシューティング

### エラー: "relation already exists"

**原因:** テーブルが既に存在する

**解決方法:**
```sql
-- 既存のテーブルを削除（注意: データが失われます）
DROP TABLE IF EXISTS champion_notes CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS app_users CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- マイグレーションスクリプトを再実行
```

### エラー: "permission denied"

**原因:** 権限不足

**解決方法:**
- Supabaseダッシュボードから実行していることを確認
- プロジェクトの管理者権限があることを確認
- サービスキーを使用している場合は、正しいキーを使用していることを確認

### エラー: "syntax error"

**原因:** SQLスクリプトの一部のみが実行された

**解決方法:**
- スクリプト全体をコピーして実行していることを確認
- 特殊文字が正しくコピーされていることを確認

## 次のステップ

マイグレーションが成功したら、以下を実行してください：

1. **RLS動作テスト**
   - `supabase/rls-test-guide.md` を参照
   - 実際のユーザー認証を使用してRLSポリシーをテスト

2. **サンプルデータの挿入**
   - `supabase/sample-data.sql` を実行
   - アプリケーションの動作確認用データを作成

3. **アプリケーション接続テスト**
   - フロントエンド・バックエンドからデータベースに接続
   - CRUD操作が正常に動作することを確認

## 参考資料

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

# データベースマイグレーション

## 概要

LoL Labのデータベーススキーマ定義。Supabase（PostgreSQL）を使用。

## 実際のDB構成

- 認証: Supabase組み込みの `auth.users` を直接使用（独自のapp_usersテーブルなし）
- RLS: `auth.uid()` でユーザーデータを分離

## ファイル一覧

### `20240101000000_create_champion_notes.sql`
マッチアップ別戦略ノートテーブルの定義。稼働中DBから後追いで復元。

- `champion_notes` テーブル作成
- `user_id` / `my_champion_id` / `enemy_champion_id` インデックス
- RLSポリシー（SELECT / INSERT / UPDATE / DELETE）
- 危険な `allok` ポリシーは意図的に再現していない（下記参照）

### `20240102000000_create_favorites.sql`
お気に入りサモナーテーブルの定義。稼働中DBから後追いで復元。

- `favorites` テーブル作成
- `(user_id, summoner_name, tag_line, region)` UNIQUE制約
- `user_id` インデックス
- RLSポリシー（SELECT / INSERT / DELETE）※UPDATEは意図的に無し

### `20240103000000_create_general_notes.sql`
汎用ノート（General Note）テーブルの定義。

- `general_notes` テーブル作成
- `(user_id, updated_at DESC)` 複合インデックス
- `tags` GINインデックス
- RLSポリシー（SELECT / INSERT / UPDATE / DELETE）
- `updated_at` 自動更新トリガー・関数

### `20240104000000_drop_champion_notes_allok_policy.sql`
`champion_notes` に残っていた全許可ポリシー `allok` の削除。

RLSのpermissiveポリシーはOR結合されるため、`USING (true)` のポリシーが
1つあるだけでユーザー分離が無効化される。**本番DBへの適用が必要。**

## 未取得の情報

以下は情報スキーマからの吸い出し対象に含めていないため、このディレクトリには記録がない。

- トリガー定義（`general_notes` 以外）
- ポリシーの適用ロール（`pg_policies.roles`）
- Supabase Auth / Storage の設定

## 実行方法

Supabase SQL Editorにファイルの内容を貼り付けて実行。

## 関連ドキュメント

- `.kiro/specs/note-database-design/design.md`: データベース設計書

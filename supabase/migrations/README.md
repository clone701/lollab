# データベースマイグレーション

## 概要

LoL Labのデータベーススキーマ定義。Supabase（PostgreSQL）を使用。

## 実際のDB構成

- 認証: Supabase組み込みの `auth.users` を直接使用（独自のapp_usersテーブルなし）
- RLS: `auth.uid()` でユーザーデータを分離

## ファイル一覧

### `20240103000000_create_general_notes.sql`
汎用ノート（General Note）テーブルの定義。

- `general_notes` テーブル作成
- `(user_id, updated_at DESC)` 複合インデックス
- `tags` GINインデックス
- RLSポリシー（SELECT / INSERT / UPDATE / DELETE）
- `updated_at` 自動更新トリガー・関数

## 実行方法

Supabase SQL Editorにファイルの内容を貼り付けて実行。

## 関連ドキュメント

- `.kiro/specs/note-database-design/design.md`: データベース設計書

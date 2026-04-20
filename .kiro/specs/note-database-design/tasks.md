# 実装計画: ノートデータベース設計

## 概要

本実装計画は、LoL Labのノート機能におけるデータベーススキーマの実装を定義します。Supabaseを使用して、app_users、profiles、champion_notesテーブルを作成し、Row Level Security (RLS)ポリシーを設定し、パフォーマンス最適化のためのインデックスを作成します。

実装完了後、参照用として保存されていた`docs/db-schema.md`を削除します。

## タスク

- [x] 1. データベーススキーマファイルの作成
  - Supabaseマイグレーション用のSQLファイルを作成
  - app_users、profiles、champion_notesテーブルの定義を含める
  - CHECK制約、外部キー制約、デフォルト値を設定
  - _要件: 1.1, 2.1, 2.2, 2.3, 3.1, 3.2, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 8.1, 8.2, 8.3, 8.4_

- [x] 2. インデックスの作成
  - champion_notesテーブルにuser_id、my_champion_id、enemy_champion_id、note_typeのインデックスを作成
  - app_usersテーブルに(provider, provider_id)のユニークインデックスを作成
  - パフォーマンス最適化のための複合インデックスを検討
  - _要件: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 3. Row Level Security (RLS) ポリシーの設定
  - champion_notesテーブルのRLSを有効化
  - SELECT、INSERT、UPDATE、DELETEポリシーを作成（ユーザーは自分のノートのみアクセス可能）
  - app_usersテーブルのRLSを有効化
  - SELECT、UPDATEポリシーを作成（ユーザーは自分の情報のみアクセス可能）
  - _要件: 4.1, 4.2, 4.3, 4.4, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [x] 4. マイグレーションスクリプトの実行とテスト
  - Supabase SQL Editorまたはマイグレーションツールを使用してスクリプトを実行
  - テーブル作成の成功を確認
  - インデックスの作成を確認
  - RLSポリシーの動作を確認
  - _要件: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 5. 既存データの移行（該当する場合）
  - 既存のchampion_notesテーブルが存在する場合、note_type列を追加
  - デフォルト値'matchup'を設定
  - CHECK制約を追加
  - 既存データの整合性を検証
  - _要件: 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 6. ロールバックスクリプトの作成
  - マイグレーション失敗時のロールバック用SQLスクリプトを作成
  - インデックス削除、制約削除、テーブル削除の手順を定義
  - _要件: 9.5_

- [x] 7. データベース設計ドキュメントの整理
  - 実装完了後、`docs/db-schema.md`を削除
  - `.kiro/specs/note-database-design/design.md`が唯一の信頼できる情報源であることを確認
  - _要件: 8.1_

- [x] 8. チェックポイント - 全てのテストが成功することを確認
  - 全てのテストが成功することを確認し、質問があればユーザーに尋ねる

- [ ] 9. general_notes テーブルの作成
  - [x] 9.1 `general_notes` テーブルのDDLを作成する
    - id（bigserial PK）、user_id（FK）、title（NOT NULL）、body、tags（text[]）、created_at、updated_at
    - `tags_limit` CHECK制約（array_length(tags, 1) <= 10）
    - _要件: 2.1, 2.2, 2.3, 2.4, 2.5, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
  - [x] 9.2 インデックスを作成する
    - `(user_id, updated_at DESC)` 複合インデックス
    - `tags` GINインデックス
    - _要件: 6.1, 6.2, 6.3_
  - [x] 9.3 RLSポリシーを設定する
    - RLS有効化
    - SELECT / INSERT / UPDATE / DELETE ポリシー（auth.uid() = user_id）
    - _要件: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  - [x] 9.4 SQLをSupabase SQL Editorで実行し、テーブル・インデックス・RLSの作成を確認する

## 注意事項

- このSpecはデータベーススキーマの作成に焦点を当てています
- アプリケーションコード（FastAPI、Next.js）の実装は別のSpecで行います
- Supabaseの管理画面またはCLIを使用してマイグレーションを実行します
- RLSポリシーはSupabaseの認証システム（auth.uid()）に依存します
- 実装完了後、`docs/db-schema.md`を削除してください

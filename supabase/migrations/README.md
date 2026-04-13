# データベースマイグレーション

## 概要

このディレクトリには、LoL Labのデータベーススキーマとマイグレーションファイルが含まれています。

## ファイル一覧

### マイグレーションファイル

#### `20240101000000_initial_schema.sql`
初期データベーススキーマの定義。以下を含みます：

- **テーブル定義**:
  - `app_users`: Google認証ユーザー管理
  - `profiles`: 追加プロフィール情報（1:1関係）
  - `champion_notes`: チャンピオン戦略ノート（汎用・対策）

- **インデックス**:
  - `idx_champion_notes_user_id`: ユーザーごとのノート検索
  - `idx_champion_notes_my_champion_id`: チャンピオン検索
  - `idx_champion_notes_enemy_champion_id`: マッチアップ検索
  - `idx_champion_notes_note_type`: ノートタイプフィルタリング
  - `UNIQUE(provider, provider_id)`: app_usersの重複防止

- **Row Level Security (RLS)**:
  - 全テーブルでRLS有効化
  - ユーザーは自分のデータのみアクセス可能

- **トリガー**:
  - `update_champion_notes_updated_at`: updated_at自動更新

#### `20240102000000_add_note_type_column.sql`
既存の`champion_notes`テーブルに`note_type`列を追加するマイグレーション。以下を含みます：

- **適用対象**: 初期スキーマ作成前に`champion_notes`テーブルが存在していた場合
- **注意**: 初期スキーマを使用してテーブルを作成した場合は不要

- **変更内容**:
  - `note_type`列の追加（デフォルト値: 'matchup'）
  - CHECK制約の追加（note_type値の検証）
  - CHECK制約の追加（enemy_champion_id整合性）
  - インデックスの追加（idx_champion_notes_note_type）
  - 既存データの整合性検証

- **詳細**: `ADD_NOTE_TYPE_MIGRATION_GUIDE.md`を参照

### ドキュメント

#### `INDEX_VERIFICATION.md`
インデックス検証レポート。以下を含みます：

- ✅ 必須インデックスの検証結果（全て作成済み）
- 📋 複合インデックスの提案（4つ）
- 📊 パフォーマンステスト推奨事項
- 🔧 メンテナンス推奨事項

#### `COMPOSITE_INDEX_RECOMMENDATIONS.sql`
複合インデックスの推奨スクリプト。以下を含みます：

- **短期実装推奨**（1-3ヶ月）:
  - `idx_champion_notes_user_my_champion`: ユーザー + チャンピオン検索
  - `idx_champion_notes_user_updated`: ユーザー + 更新日時ソート

- **中期実装推奨**（3-6ヶ月）:
  - `idx_champion_notes_user_matchup`: マッチアップ検索
  - `idx_champion_notes_user_note_type`: ノートタイプフィルタリング

#### `ADD_NOTE_TYPE_MIGRATION_GUIDE.md`
note_type列追加マイグレーションの詳細ガイド。以下を含みます：

- 適用対象と適用不要なケースの説明
- マイグレーション実行前の準備手順
- 実行方法（Supabase Dashboard / CLI）
- 検証スクリプトと期待される結果
- トラブルシューティング
- ロールバック方法

#### `verify_note_type_migration.sql`
note_type列追加マイグレーションの検証スクリプト。以下を含みます：

- note_type列の存在確認
- 列定義の確認（型、制約、デフォルト値）
- CHECK制約の確認
- インデックスの確認
- データ整合性の確認

## マイグレーション実行方法

### Supabase SQL Editorを使用

1. Supabaseダッシュボードにログイン
2. SQL Editorを開く
3. `20240101000000_initial_schema.sql`の内容をコピー＆ペースト
4. 実行ボタンをクリック

### Supabase CLIを使用

```bash
# マイグレーションの適用
supabase db push

# マイグレーション履歴の確認
supabase migration list
```

## インデックス検証ステータス

| 項目 | ステータス |
|-----|----------|
| 必須インデックス作成 | ✅ 完了 (5/5) |
| RLSポリシー設定 | ✅ 完了 |
| トリガー設定 | ✅ 完了 |
| 複合インデックス | 📋 検討中 |

## パフォーマンス目標

- **検索クエリ**: 200ms以内（要件6.5）
- **ノート一覧取得**: 100ms以内（目標）
- **マッチアップ検索**: 100ms以内（目標）

## 次のステップ

1. ✅ 初期スキーマの作成完了
2. ✅ 必須インデックスの検証完了
3. 📋 アプリケーションの使用パターンを監視
4. 🔧 必要に応じて複合インデックスを実装

## 関連ドキュメント

- `.kiro/specs/note-database-design/design.md`: データベース設計書
- `.kiro/specs/note-database-design/requirements.md`: 要件定義書
- `.kiro/specs/note-database-design/tasks.md`: 実装計画

## 注意事項

- 複合インデックスは、実際の使用パターンを監視した後に実装することを推奨
- インデックスの追加はストレージを消費するため、必要性を慎重に判断
- 定期的なVACUUM ANALYZEでインデックスのメンテナンスを実施

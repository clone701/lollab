# タスク5完了サマリー: 既存データの移行

## 概要

タスク5「既存データの移行（該当する場合）」が完了しました。このタスクでは、既存の`champion_notes`テーブルに`note_type`列を追加するためのマイグレーションスクリプトとドキュメントを作成しました。

## 作成されたファイル

### 1. マイグレーションスクリプト

#### `20240102000000_add_note_type_column.sql`
既存の`champion_notes`テーブルに`note_type`列を追加するマイグレーションスクリプト。

**機能:**
- note_type列の追加（デフォルト値: 'matchup'）
- CHECK制約の追加（note_type値の検証）
- CHECK制約の追加（enemy_champion_id整合性）
- インデックスの追加（idx_champion_notes_note_type）
- 既存データの整合性検証
- 前提条件チェック（テーブル存在確認、列の重複チェック）

**安全機能:**
- 既にnote_type列が存在する場合は自動的にスキップ
- テーブルが存在しない場合はエラーメッセージを表示
- 既存データの整合性問題を検出して警告

#### `20240102000001_rollback_add_note_type_column.sql`
note_type列追加マイグレーションのロールバックスクリプト。

**機能:**
- インデックスの削除
- CHECK制約の削除
- note_type列の削除
- 汎用ノート（note_type='general'）の存在確認と警告

### 2. ドキュメント

#### `ADD_NOTE_TYPE_MIGRATION_GUIDE.md`
note_type列追加マイグレーションの詳細ガイド。

**内容:**
- 適用対象と適用不要なケースの説明
- マイグレーション実行前の準備手順
- 実行方法（Supabase Dashboard / CLI）
- 検証スクリプトと期待される結果
- トラブルシューティング
- ロールバック方法
- 次のステップ

#### `verify_note_type_migration.sql`
note_type列追加マイグレーションの検証スクリプト。

**検証項目:**
1. note_type列の存在確認
2. 列定義の確認（型、制約、デフォルト値）
3. CHECK制約（note_type）の存在確認
4. CHECK制約（enemy_champion_id）の存在確認
5. インデックスの存在確認
6. 既存データのnote_type値確認
7. データ整合性確認（matchup + NULL enemy）
8. データ整合性確認（general + NOT NULL enemy）

#### `MIGRATION_DECISION_GUIDE.md`
どのマイグレーションスクリプトを使用すべきかを判断するためのガイド。

**内容:**
- 状況別マイグレーション選択（3つのケース）
- フローチャート
- 確認用SQLクエリ
- よくある質問（FAQ）
- トラブルシューティング

### 3. 更新されたファイル

#### `supabase/migrations/README.md`
マイグレーション概要ドキュメントに以下を追加：
- 20240102000000_add_note_type_column.sqlの説明
- ADD_NOTE_TYPE_MIGRATION_GUIDE.mdの説明
- verify_note_type_migration.sqlの説明

## 要件の充足状況

### 要件8: 既存データとの互換性

| 受け入れ基準 | 状態 | 実装内容 |
|------------|------|---------|
| 8.1 既存のchampion_notesテーブル構造を拡張する | ✅ | マイグレーションスクリプトで既存テーブルにnote_type列を追加 |
| 8.2 既存のノートをnote_type='matchup'として扱う | ✅ | デフォルト値'matchup'を設定 |
| 8.3 既存のカラムを保持する | ✅ | 既存の列は変更せず、note_type列のみ追加 |
| 8.4 note_type列を新規追加する | ✅ | ALTER TABLE ADD COLUMNで追加 |

### 要件9: マイグレーション戦略

| 受け入れ基準 | 状態 | 実装内容 |
|------------|------|---------|
| 9.1 note_type列をデフォルト値'matchup'で追加 | ✅ | DEFAULT 'matchup' NOT NULLで追加 |
| 9.2 既存のレコードに'matchup'を設定 | ✅ | デフォルト値により自動設定 |
| 9.3 CHECK制約を追加 | ✅ | check_note_typeとcheck_enemy_champion_id制約を追加 |
| 9.4 必要なインデックスを作成 | ✅ | idx_champion_notes_note_typeインデックスを作成 |
| 9.5 ロールバック可能 | ✅ | ロールバックスクリプトを作成 |

## 使用方法

### 新規プロジェクトの場合

```bash
# 初期スキーマを使用（note_type列が既に含まれている）
supabase/migrations/20240101000000_initial_schema.sql
```

### 既存プロジェクトの場合（古いスキーマを使用）

```bash
# 1. データベースバックアップを取得（推奨）
CREATE TABLE champion_notes_backup AS SELECT * FROM champion_notes;

# 2. マイグレーションを実行
supabase/migrations/20240102000000_add_note_type_column.sql

# 3. 検証を実行
supabase/migrations/verify_note_type_migration.sql
```

### 既存プロジェクトの場合（初期スキーマを使用済み）

```bash
# マイグレーション不要
# note_type列は既に存在しています
```

## 注意事項

### 適用対象

このマイグレーションは、以下の条件に該当する場合に**のみ**実行してください：

- ✅ `champion_notes`テーブルが既に存在する
- ✅ `note_type`列が存在しない（古いスキーマを使用している）
- ✅ 既存のノートデータを保持したい

### 適用不要なケース

以下の場合、このマイグレーションは**不要**です：

- ❌ 初期スキーマ（`20240101000000_initial_schema.sql`）を使用してテーブルを作成した場合
- ❌ `champion_notes`テーブルがまだ存在しない場合

### データの扱い

- 既存のレコードは全て`note_type='matchup'`として扱われます
- 汎用ノート機能を使用する場合は、アプリケーション側で`note_type='general'`を指定してください
- マイグレーション実行前に必ずバックアップを取得してください

## テスト方法

### 1. 前提条件の確認

```sql
-- champion_notesテーブルが存在することを確認
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_name = 'champion_notes'
) AS table_exists;

-- note_type列が存在しないことを確認
SELECT EXISTS (
  SELECT FROM information_schema.columns 
  WHERE table_schema = 'public' 
    AND table_name = 'champion_notes' 
    AND column_name = 'note_type'
) AS note_type_exists;
-- 結果がfalseであることを確認
```

### 2. マイグレーションの実行

```sql
-- マイグレーションスクリプトを実行
-- supabase/migrations/20240102000000_add_note_type_column.sql
```

### 3. 検証の実行

```sql
-- 検証スクリプトを実行
-- supabase/migrations/verify_note_type_migration.sql

-- 全ての検証項目が✓ PASSであることを確認
```

### 4. データの確認

```sql
-- 既存のレコードがnote_type='matchup'になっていることを確認
SELECT note_type, COUNT(*) AS count
FROM champion_notes
GROUP BY note_type;

-- 期待される結果:
-- note_type | count
-- ----------+-------
-- matchup   | <既存のレコード数>
```

## トラブルシューティング

### エラー: "champion_notesテーブルが存在しません"

**解決方法:** 初期スキーマ（`20240101000000_initial_schema.sql`）を先に実行してください。

### エラー: "note_type列は既に存在します"

**解決方法:** このマイグレーションは不要です。スクリプトは自動的にスキップされます。

### 警告: "X 件のレコードがnote_type='matchup'でenemy_champion_id=NULLです"

**解決方法:** データの整合性に問題があります。以下のいずれかを実行してください：

1. 汎用ノートに変更: `UPDATE champion_notes SET note_type = 'general' WHERE ...`
2. レコードを削除: `DELETE FROM champion_notes WHERE ...`
3. enemy_champion_idを設定: `UPDATE champion_notes SET enemy_champion_id = '...' WHERE ...`

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
- `.kiro/specs/note-database-design/requirements.md`: 要件定義書
- `.kiro/specs/note-database-design/tasks.md`: 実装計画
- `supabase/migrations/README.md`: マイグレーション概要
- `supabase/migration-execution-guide.md`: 初期スキーマ実行ガイド
- `supabase/MIGRATION_DECISION_GUIDE.md`: マイグレーション選択ガイド

## まとめ

タスク5では、既存の`champion_notes`テーブルに`note_type`列を追加するための包括的なマイグレーションソリューションを作成しました。

**作成されたもの:**
- ✅ マイグレーションスクリプト（追加・ロールバック）
- ✅ 詳細な実行ガイド
- ✅ 検証スクリプト
- ✅ マイグレーション選択ガイド
- ✅ ドキュメントの更新

**安全性:**
- ✅ 前提条件チェック
- ✅ 既存データの整合性検証
- ✅ ロールバック機能
- ✅ 詳細なエラーハンドリング

**使いやすさ:**
- ✅ 状況別の明確なガイド
- ✅ フローチャートとFAQ
- ✅ トラブルシューティング
- ✅ 検証スクリプト

このマイグレーションソリューションにより、既存のデータを安全に保持したまま、新しい`note_type`機能を追加できます。

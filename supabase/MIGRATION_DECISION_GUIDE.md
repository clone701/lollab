# マイグレーション選択ガイド

## 概要

このドキュメントは、どのマイグレーションスクリプトを使用すべきかを判断するためのガイドです。

## 状況別マイグレーション選択

### ケース1: 新規プロジェクト（テーブルが存在しない）

**状況:**
- データベースが空、またはchampion_notesテーブルが存在しない
- 初めてLoL Labのデータベースをセットアップする

**使用するマイグレーション:**
```
✅ 20240101000000_initial_schema.sql
```

**理由:**
- 初期スキーマには既にnote_type列が含まれています
- 全てのテーブル、インデックス、RLSポリシーが一度に作成されます

**実行手順:**
1. `supabase/migrations/20240101000000_initial_schema.sql`を実行
2. `supabase/verification-scripts.sql`で検証
3. 完了

---

### ケース2: 既存プロジェクト（古いスキーマを使用）

**状況:**
- champion_notesテーブルが既に存在する
- note_type列が存在しない（古いスキーマを使用している）
- 既存のノートデータを保持したい

**使用するマイグレーション:**
```
✅ 20240102000000_add_note_type_column.sql
```

**理由:**
- 既存のテーブルにnote_type列を追加します
- 既存のデータを保持したまま新しい機能を追加できます
- 既存のレコードは全てnote_type='matchup'として扱われます

**実行手順:**
1. データベースバックアップを取得（推奨）
2. `supabase/migrations/ADD_NOTE_TYPE_MIGRATION_GUIDE.md`を読む
3. `supabase/migrations/20240102000000_add_note_type_column.sql`を実行
4. `supabase/migrations/verify_note_type_migration.sql`で検証
5. 完了

---

### ケース3: 既存プロジェクト（初期スキーマを使用済み）

**状況:**
- champion_notesテーブルが既に存在する
- note_type列が既に存在する（初期スキーマを使用している）

**使用するマイグレーション:**
```
❌ マイグレーション不要
```

**理由:**
- 既にnote_type列が存在しているため、追加のマイグレーションは不要です

**確認方法:**
```sql
-- note_type列の存在確認
SELECT EXISTS (
  SELECT FROM information_schema.columns 
  WHERE table_schema = 'public' 
    AND table_name = 'champion_notes' 
    AND column_name = 'note_type'
) AS note_type_exists;

-- 結果がtrueの場合、マイグレーション不要
```

---

## フローチャート

```
データベースをセットアップしたい
    |
    v
champion_notesテーブルは存在する？
    |
    +-- NO --> 20240101000000_initial_schema.sql を実行
    |
    +-- YES --> note_type列は存在する？
                |
                +-- NO --> 20240102000000_add_note_type_column.sql を実行
                |
                +-- YES --> マイグレーション不要
```

## 確認用SQLクエリ

### テーブルの存在確認

```sql
-- champion_notesテーブルが存在するか確認
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_name = 'champion_notes'
) AS table_exists;
```

### note_type列の存在確認

```sql
-- note_type列が存在するか確認
SELECT EXISTS (
  SELECT FROM information_schema.columns 
  WHERE table_schema = 'public' 
    AND table_name = 'champion_notes' 
    AND column_name = 'note_type'
) AS note_type_exists;
```

### 現在のスキーマ確認

```sql
-- champion_notesテーブルの全列を確認
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'champion_notes'
ORDER BY ordinal_position;
```

## よくある質問

### Q1: 両方のマイグレーションを実行する必要がありますか？

**A:** いいえ。状況に応じて**どちらか一方**を実行してください。

- 新規プロジェクト → 初期スキーマのみ
- 既存プロジェクト（古いスキーマ） → note_type追加マイグレーションのみ

### Q2: 間違ったマイグレーションを実行してしまいました

**A:** 以下の対処方法があります：

1. **初期スキーマを実行してエラーが出た場合:**
   - エラーメッセージを確認
   - "relation already exists"の場合、テーブルが既に存在しています
   - note_type追加マイグレーションを使用してください

2. **note_type追加マイグレーションを実行してエラーが出た場合:**
   - エラーメッセージを確認
   - "champion_notesテーブルが存在しません"の場合、初期スキーマを使用してください
   - "note_type列は既に存在します"の場合、マイグレーション不要です

### Q3: ロールバックが必要な場合は？

**A:** 各マイグレーションにはロールバックスクリプトが用意されています：

- 初期スキーマのロールバック: `20240101000001_rollback_initial_schema.sql`
- note_type追加のロールバック: `20240102000001_rollback_add_note_type_column.sql`

**警告:** ロールバックを実行するとデータが失われる可能性があります。必ずバックアップを取得してから実行してください。

### Q4: 本番環境とローカル環境で異なるマイグレーションを使用できますか？

**A:** はい、可能です。各環境の状況に応じて適切なマイグレーションを選択してください。

例:
- ローカル環境（新規）: 初期スキーマ
- 本番環境（既存）: note_type追加マイグレーション

## トラブルシューティング

### エラー: "relation already exists"

**原因:** テーブルが既に存在する

**解決方法:**
1. 現在のスキーマを確認
2. note_type列が存在しない場合、note_type追加マイグレーションを使用
3. note_type列が存在する場合、マイグレーション不要

### エラー: "column already exists"

**原因:** note_type列が既に存在する

**解決方法:**
- マイグレーション不要です
- スクリプトは自動的にスキップされます

### エラー: "permission denied"

**原因:** 権限不足

**解決方法:**
- Supabaseダッシュボードから実行していることを確認
- プロジェクトの管理者権限があることを確認

## 関連ドキュメント

- `supabase/migrations/README.md`: マイグレーション概要
- `supabase/migration-execution-guide.md`: 初期スキーマ実行ガイド
- `supabase/migrations/ADD_NOTE_TYPE_MIGRATION_GUIDE.md`: note_type追加マイグレーションガイド
- `.kiro/specs/note-database-design/design.md`: データベース設計書

## サポート

問題が解決しない場合は、以下の情報を含めて報告してください：

1. 現在のデータベース状態（テーブル一覧、列一覧）
2. 実行したマイグレーションスクリプト
3. エラーメッセージの全文
4. 使用している環境（ローカル/本番、Supabase Dashboard/CLI）

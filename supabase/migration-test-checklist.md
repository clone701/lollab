# マイグレーションテストチェックリスト

## 概要

このドキュメントは、データベースマイグレーション実行後の包括的なテストチェックリストです。すべての項目をチェックして、マイグレーションが正常に完了したことを確認してください。

## 実行日時

- **マイグレーション実行日**: _______________
- **テスト実施者**: _______________
- **環境**: □ 開発 □ ステージング □ 本番

---

## Phase 1: マイグレーション実行

### 1.1 マイグレーションスクリプトの実行

- [ ] `supabase/migrations/20240101000000_initial_schema.sql` を実行
- [ ] エラーなく完了した
- [ ] 実行時間: _______ 秒

### 1.2 実行方法

使用した方法:
- [ ] Supabase Dashboard (SQL Editor)
- [ ] Supabase CLI
- [ ] その他: _______________

---

## Phase 2: テーブル作成の確認

### 2.1 テーブルの存在確認

実行: `verification-scripts.sql` のセクション1

- [ ] `app_users` テーブルが作成された
- [ ] `profiles` テーブルが作成された
- [ ] `champion_notes` テーブルが作成された

### 2.2 app_users テーブル構造

実行: `verification-scripts.sql` のセクション2

- [ ] `id` (uuid, PK)
- [ ] `email` (text, NOT NULL)
- [ ] `name` (text, NULL)
- [ ] `image` (text, NULL)
- [ ] `provider` (text, NOT NULL)
- [ ] `provider_id` (text, NOT NULL)
- [ ] `created_at` (timestamp, NOT NULL, DEFAULT now())

### 2.3 profiles テーブル構造

- [ ] `id` (uuid, PK, FK)
- [ ] `display_name` (text, NULL)
- [ ] `icon_url` (text, NULL)
- [ ] `created_at` (timestamp, NOT NULL, DEFAULT now())

### 2.4 champion_notes テーブル構造

- [ ] `id` (bigint, PK)
- [ ] `user_id` (uuid, FK, NOT NULL)
- [ ] `note_type` (text, NOT NULL)
- [ ] `my_champion_id` (text, NOT NULL)
- [ ] `enemy_champion_id` (text, NULL)
- [ ] `runes` (jsonb, NULL)
- [ ] `spells` (jsonb, NULL)
- [ ] `items` (jsonb, NULL)
- [ ] `memo` (text, NULL)
- [ ] `created_at` (timestamp, NOT NULL, DEFAULT now())
- [ ] `updated_at` (timestamp, NOT NULL, DEFAULT now())

---

## Phase 3: インデックスの確認

実行: `verification-scripts.sql` のセクション3

### 3.1 champion_notes テーブルのインデックス

- [ ] `idx_champion_notes_user_id` が作成された
- [ ] `idx_champion_notes_my_champion_id` が作成された
- [ ] `idx_champion_notes_enemy_champion_id` が作成された
- [ ] `idx_champion_notes_note_type` が作成された

### 3.2 app_users テーブルのインデックス

- [ ] `app_users_provider_provider_id_key` (UNIQUE) が作成された

### 3.3 インデックス数の確認

- [ ] 合計5つ以上のインデックスが作成された（主キーインデックスを含む）

---

## Phase 4: 制約の確認

実行: `verification-scripts.sql` のセクション4

### 4.1 CHECK制約

- [ ] `champion_notes.note_type` に CHECK制約が存在する
  - 値: 'general' または 'matchup'
- [ ] `champion_notes.enemy_champion_id` の整合性CHECK制約が存在する
  - matchupの場合: enemy_champion_id NOT NULL
  - generalの場合: enemy_champion_id IS NULL

### 4.2 外部キー制約

- [ ] `champion_notes.user_id` → `app_users.id` (CASCADE DELETE)
- [ ] `profiles.id` → `app_users.id` (CASCADE DELETE)

### 4.3 UNIQUE制約

- [ ] `app_users(provider, provider_id)` にUNIQUE制約が存在する

---

## Phase 5: Row Level Security (RLS) の確認

実行: `verification-scripts.sql` のセクション5

### 5.1 RLS有効化の確認

- [ ] `app_users` テーブルでRLSが有効
- [ ] `profiles` テーブルでRLSが有効
- [ ] `champion_notes` テーブルでRLSが有効

### 5.2 app_users テーブルのポリシー

- [ ] SELECT ポリシー: "Users can view their own profile"
- [ ] UPDATE ポリシー: "Users can update their own profile"

### 5.3 profiles テーブルのポリシー

- [ ] SELECT ポリシー: "Users can view their own profile"
- [ ] INSERT ポリシー: "Users can create their own profile"
- [ ] UPDATE ポリシー: "Users can update their own profile"
- [ ] DELETE ポリシー: "Users can delete their own profile"

### 5.4 champion_notes テーブルのポリシー

- [ ] SELECT ポリシー: "Users can view their own notes"
- [ ] INSERT ポリシー: "Users can create their own notes"
- [ ] UPDATE ポリシー: "Users can update their own notes"
- [ ] DELETE ポリシー: "Users can delete their own notes"

### 5.5 ポリシー数の確認

- [ ] 合計10個のRLSポリシーが作成された

---

## Phase 6: トリガーと関数の確認

実行: `verification-scripts.sql` のセクション6-7

### 6.1 関数の確認

- [ ] `update_updated_at_column()` 関数が作成された
- [ ] 関数の戻り値型: TRIGGER

### 6.2 トリガーの確認

- [ ] `update_champion_notes_updated_at` トリガーが作成された
- [ ] トリガーのタイミング: BEFORE UPDATE
- [ ] トリガーの対象テーブル: champion_notes

---

## Phase 7: コメントの確認

実行: `verification-scripts.sql` のセクション8

### 7.1 テーブルコメント

- [ ] `app_users` テーブルにコメントが存在する
- [ ] `profiles` テーブルにコメントが存在する
- [ ] `champion_notes` テーブルにコメントが存在する

### 7.2 カラムコメント

- [ ] `app_users` の各カラムにコメントが存在する
- [ ] `champion_notes` の各カラムにコメントが存在する

---

## Phase 8: サンプルデータの挿入

実行: `sample-data.sql`

### 8.1 データ挿入

- [ ] サンプルデータスクリプトを実行
- [ ] エラーなく完了した

### 8.2 データ確認

- [ ] `app_users`: 2件のユーザーが挿入された
- [ ] `profiles`: 2件のプロフィールが挿入された
- [ ] `champion_notes`: 6件のノートが挿入された
  - ユーザーA: 3件（汎用1件、対策2件）
  - ユーザーB: 3件（汎用1件、対策2件）

---

## Phase 9: RLS動作テスト

参照: `rls-test-guide.md`

### 9.1 テストユーザーの作成

- [ ] テストユーザーAを作成した
- [ ] テストユーザーBを作成した
- [ ] ユーザーIDをメモした

### 9.2 app_users テーブルのRLSテスト

- [ ] ユーザーは自分のプロフィールを読み取れる
- [ ] ユーザーは他のユーザーのプロフィールを読み取れない
- [ ] ユーザーは自分のプロフィールを更新できる
- [ ] ユーザーは他のユーザーのプロフィールを更新できない

### 9.3 champion_notes テーブルのRLSテスト

#### SELECT ポリシー
- [ ] ユーザーAは自分のノート（3件）のみ読み取れる
- [ ] ユーザーBは自分のノート（3件）のみ読み取れる
- [ ] ユーザーは他のユーザーのノートを読み取れない

#### INSERT ポリシー
- [ ] ユーザーは自分のuser_idでノートを作成できる
- [ ] ユーザーは他のユーザーのuser_idでノートを作成できない

#### UPDATE ポリシー
- [ ] ユーザーは自分のノートを更新できる
- [ ] ユーザーは他のユーザーのノートを更新できない

#### DELETE ポリシー
- [ ] ユーザーは自分のノートを削除できる
- [ ] ユーザーは他のユーザーのノートを削除できない

### 9.4 未認証ユーザーのテスト

- [ ] 未認証ユーザーはすべての操作が拒否される

---

## Phase 10: データ整合性テスト

### 10.1 CHECK制約のテスト

```sql
-- 成功するケース: note_type='general', enemy_champion_id=NULL
INSERT INTO champion_notes (user_id, note_type, my_champion_id, enemy_champion_id)
VALUES ('user-id', 'general', 'Ahri', NULL);
```
- [ ] 成功した

```sql
-- 成功するケース: note_type='matchup', enemy_champion_id='Yasuo'
INSERT INTO champion_notes (user_id, note_type, my_champion_id, enemy_champion_id)
VALUES ('user-id', 'matchup', 'Ahri', 'Yasuo');
```
- [ ] 成功した

```sql
-- 失敗するケース: note_type='matchup', enemy_champion_id=NULL
INSERT INTO champion_notes (user_id, note_type, my_champion_id, enemy_champion_id)
VALUES ('user-id', 'matchup', 'Ahri', NULL);
```
- [ ] エラーが発生した（期待通り）

```sql
-- 失敗するケース: note_type='invalid'
INSERT INTO champion_notes (user_id, note_type, my_champion_id, enemy_champion_id)
VALUES ('user-id', 'invalid', 'Ahri', NULL);
```
- [ ] エラーが発生した（期待通り）

### 10.2 外部キー制約のテスト

```sql
-- 失敗するケース: 存在しないuser_id
INSERT INTO champion_notes (user_id, note_type, my_champion_id)
VALUES ('non-existent-uuid', 'general', 'Ahri');
```
- [ ] エラーが発生した（期待通り）

### 10.3 CASCADE DELETEのテスト

```sql
-- ユーザーを削除すると、関連するノートも削除される
DELETE FROM app_users WHERE id = 'test-user-id';
```
- [ ] ユーザーが削除された
- [ ] 関連するchampion_notesも削除された
- [ ] 関連するprofilesも削除された

---

## Phase 11: トリガー動作テスト

### 11.1 updated_at自動更新のテスト

```sql
-- ノートを作成
INSERT INTO champion_notes (user_id, note_type, my_champion_id, memo)
VALUES ('user-id', 'general', 'Ahri', 'Original memo')
RETURNING id, created_at, updated_at;
```
- [ ] created_at と updated_at が同じ値で作成された

```sql
-- 数秒待ってから更新
UPDATE champion_notes 
SET memo = 'Updated memo'
WHERE id = 'note-id'
RETURNING created_at, updated_at;
```
- [ ] updated_at が更新された
- [ ] created_at は変更されていない
- [ ] updated_at > created_at

---

## Phase 12: パフォーマンステスト

### 12.1 インデックスの効果確認

```sql
-- インデックスを使用するクエリ
EXPLAIN ANALYZE
SELECT * FROM champion_notes WHERE user_id = 'user-id';
```
- [ ] Index Scan が使用されている
- [ ] 実行時間: _______ ms（200ms以内が目標）

```sql
-- インデックスを使用するクエリ
EXPLAIN ANALYZE
SELECT * FROM champion_notes WHERE my_champion_id = 'Ahri';
```
- [ ] Index Scan が使用されている
- [ ] 実行時間: _______ ms

### 12.2 複合クエリのパフォーマンス

```sql
EXPLAIN ANALYZE
SELECT * FROM champion_notes 
WHERE user_id = 'user-id' 
  AND my_champion_id = 'Ahri'
  AND note_type = 'matchup';
```
- [ ] 実行時間: _______ ms（200ms以内が目標）

---

## Phase 13: JSON データのテスト

### 13.1 JSONB データの挿入

```sql
INSERT INTO champion_notes (
  user_id, note_type, my_champion_id,
  runes, spells, items
)
VALUES (
  'user-id', 'general', 'Ahri',
  '{"primaryPath": 8100, "keystone": 8112}'::jsonb,
  '["SummonerFlash", "SummonerIgnite"]'::jsonb,
  '["1055", "2003"]'::jsonb
);
```
- [ ] 成功した

### 13.2 JSONB データの検索

```sql
SELECT * FROM champion_notes 
WHERE runes->>'primaryPath' = '8100';
```
- [ ] 正しい結果が返された

```sql
SELECT * FROM champion_notes 
WHERE spells @> '["SummonerFlash"]'::jsonb;
```
- [ ] 正しい結果が返された

---

## Phase 14: エッジケースのテスト

### 14.1 NULL値のテスト

```sql
-- すべてのオプショナルフィールドをNULLで挿入
INSERT INTO champion_notes (user_id, note_type, my_champion_id)
VALUES ('user-id', 'general', 'Ahri');
```
- [ ] 成功した
- [ ] runes, spells, items, memo がNULLで保存された

### 14.2 長いテキストのテスト

```sql
-- 長いmemoを挿入（10,000文字）
INSERT INTO champion_notes (user_id, note_type, my_champion_id, memo)
VALUES ('user-id', 'general', 'Ahri', repeat('a', 10000));
```
- [ ] 成功した

### 14.3 特殊文字のテスト

```sql
-- 特殊文字を含むmemoを挿入
INSERT INTO champion_notes (user_id, note_type, my_champion_id, memo)
VALUES ('user-id', 'general', 'Ahri', 'Test with special chars: ''quotes'', "double", \backslash, 日本語');
```
- [ ] 成功した
- [ ] 特殊文字が正しく保存された

---

## Phase 15: 最終確認

### 15.1 サマリー情報の確認

実行: `verification-scripts.sql` のセクション9

- [ ] テーブル数: 3
- [ ] インデックス数: 5以上
- [ ] RLSポリシー数: 10
- [ ] トリガー数: 1
- [ ] 関数数: 1以上

### 15.2 ドキュメントの確認

- [ ] `migration-execution-guide.md` を確認した
- [ ] `rls-test-guide.md` を確認した
- [ ] `verification-scripts.sql` を実行した
- [ ] `sample-data.sql` を実行した

### 15.3 要件との照合

参照: `.kiro/specs/note-database-design/requirements.md`

- [ ] 要件1: ノートタイプの識別 - 満たしている
- [ ] 要件2: 汎用ノートのデータ構造 - 満たしている
- [ ] 要件3: 対策ノートのデータ構造 - 満たしている
- [ ] 要件4: ユーザーデータの分離 - 満たしている
- [ ] 要件5: データの整合性とバリデーション - 満たしている
- [ ] 要件6: 検索パフォーマンスの最適化 - 満たしている
- [ ] 要件7: JSONデータ構造の定義 - 満たしている
- [ ] 要件9: マイグレーション戦略 - 満たしている
- [ ] 要件10: Supabase Row Level Security - 満たしている

---

## 問題と解決策

### 発見された問題

1. **問題**: _______________
   - **解決策**: _______________
   - **ステータス**: □ 解決済み □ 未解決

2. **問題**: _______________
   - **解決策**: _______________
   - **ステータス**: □ 解決済み □ 未解決

---

## 承認

### テスト結果

- [ ] すべてのテストが成功した
- [ ] 発見された問題はすべて解決された
- [ ] マイグレーションは本番環境にデプロイ可能

### 署名

- **テスト実施者**: _______________
- **日付**: _______________
- **承認者**: _______________
- **日付**: _______________

---

## 次のステップ

マイグレーションテストが完了したら:

1. [ ] アプリケーションコード（FastAPI、Next.js）の実装を開始
2. [ ] 統合テストの実施
3. [ ] 本番環境へのデプロイ計画の作成
4. [ ] ユーザー受け入れテスト（UAT）の実施

## 参考資料

- [マイグレーション実行ガイド](./migration-execution-guide.md)
- [検証スクリプト](./verification-scripts.sql)
- [RLSテストガイド](./rls-test-guide.md)
- [サンプルデータ](./sample-data.sql)
- [設計書](./.kiro/specs/note-database-design/design.md)
- [要件定義書](./.kiro/specs/note-database-design/requirements.md)

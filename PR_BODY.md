## 概要

このPRは2つの独立した修正を含みます:

### 1. データベースセキュリティ修正
- `champion_notes` の `allok` RLSポリシー削除マイグレーション追加
- `champion_notes` / `favorites` のマイグレーション整備（稼働中DBから復元）

### 2. フロントエンドバグ修正
- チャンピオン変更時に古いノート内容が表示されるバグを修正
- 状態リセットロジックの一貫性改善

### 3. 依存関係の脆弱性修正
- critical レベルの脆弱性を解決（npm audit fix）

---

## 修正1: データベースセキュリティ

### 問題
`champion_notes` テーブルに以下のRLSポリシーが残っていた:
```sql
CREATE POLICY "allok" ON champion_notes FOR ALL USING (true) WITH CHECK (true);
```

PostgreSQLのpermissiveポリシーはOR結合されるため、このポリシーが存在すると `auth.uid() = user_id` による絞り込みが実質的に無効化される。フロントエンドが `anon` キーをブラウザに露出する構成のため、**他ユーザーのノートが読み書き可能な状態**だった。

### 修正内容
- `20240104000000_drop_champion_notes_allok_policy.sql` 追加
- `20240101000000_create_champion_notes.sql` 追加（`allok` は意図的に除外）
- `20240102000000_create_favorites.sql` 追加
- `migrations/README.md` 更新

### 影響範囲
稼働中のSupabaseに `allok` ポリシーが残っているため、マイグレーション適用が必要。

---

## 修正2: チャンピオン変更バグ

### 問題
ノート詳細表示中に相手/自分のチャンピオンを変更すると、変更前のノート内容が表示され続けていた。

**再現手順**:
1. チャンピオン選択（例: Ahri vs Zed）
2. ノートを作成して保存
3. ノートをクリックして詳細表示
4. サイドバーで相手チャンピオンを変更（Zed → Yasuo）
5. **問題**: 画面には Zed 用のノート内容が表示され続ける

**原因**: `handleMyChampionChange` / `handleEnemyChampionChange` がチャンピオンIDだけ更新し、以下の状態が古いまま残っていた:
- `viewMode`: `'view'` のまま（`'list'` に戻らない）
- `selectedNote`: 古いノートオブジェクトが残る
- `selectedNoteId`: 古いノートIDが残る
- `showForm`: フォーム表示状態も残る

### 修正内容
`frontend/src/app/notes/useNotesPage.tsx`:
- `handleMyChampionChange` でチャンピオンID更新時に状態をリセット
- `handleEnemyChampionChange` でチャンピオンID更新時に状態をリセット
- `showForm`, `viewMode`, `selectedNote`, `selectedNoteId` を全てクリア
- `handleReset` と同じリセットロジックを適用（一貫性）

### テスト追加
- `useNotesPage.champion-change.test.tsx`: 状態管理のユニットテスト（10ケース）
- `MatchupTabContent.champion-change.test.tsx`: 表示の統合テスト（10ケース）
- **全20テスト通過**

---

## 修正3: 依存関係の脆弱性修正

### 修正内容
`npm audit fix` を実行して critical レベルの脆弱性を解決:
- ✅ `sharp`: libvips / libheif / librsvg 関連の脆弱性
- ✅ `tar`: DoS 脆弱性（6件）
- ✅ `brace-expansion`: DoS 脆弱性
- ✅ `browserslist`: メモリリーク
- ✅ `js-yaml`: DoS 脆弱性

### 残存する脆弱性
- ⚠️ `postcss` (high): Next.js 15.5.9 の依存関係
  - Next.js 16.4.3+ へのアップグレードが必要（Breaking change）
  - 開発環境のみの影響（本番ビルドには影響小）
  - 別PRで対応予定

---

## チェックリスト

- [x] コードレビュー可能
- [x] テスト追加・更新済み（20ケース）
- [x] lint / type-check 通過
- [x] critical レベルの脆弱性修正
- [ ] **本番DBに `20240104000000_drop_champion_notes_allok_policy.sql` 適用（デプロイ前に必須）**

## デプロイ前の必須作業

Supabase SQL Editor で以下を実行:
```sql
DROP POLICY IF EXISTS "allok" ON champion_notes;
```

## 関連Issue
なし（バグ発見と修正を同時実施）

## コミット履歴
```
93a3c05 chore(deps): npm audit fix で critical レベルの脆弱性を修正
243c14f fix(notes): チャンピオン変更時に状態をリセットして古いノートが表示されるバグを修正
2cec32c fix(db): champion_notes の全許可RLSポリシー削除とマイグレーション整備
```

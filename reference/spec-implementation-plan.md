# Spec実装計画

## 概要

現状の手動実装を削除し、Kiroに体系的に再構築させるための実装順序を定義します。

---

## 実装済みSpec

### ✅ Spec 1-1: 基本UIレイアウト (basic-ui-structure)
**状態**: 完了

**内容**:
- ルートレイアウト (layout.tsx, globals.css)
- ナビゲーションバー (Navbar.tsx)
- フッター (Footer.tsx)
- 認証システム (NextAuth.js, Google OAuth)
- Noto Sans JPフォント設定

**ファイル**:
```
frontend/src/app/layout.tsx
frontend/src/app/globals.css
frontend/src/components/Navbar.tsx
frontend/src/components/Footer.tsx
frontend/src/app/api/auth/[...nextauth]/route.ts
frontend/src/app/providers.tsx
frontend/tailwind.config.js
```

---

### ✅ Spec 1-2: 共通コンポーネント (common-components)
**状態**: 完了

**内容**:
- Panel (汎用パネルコンポーネント)
- GlobalLoading (ローディング表示)
- スタイル定数 (BORDER_STYLE_1, BORDER_STYLE_2)

**ファイル**:
```
frontend/src/components/ui/Panel.tsx
frontend/src/components/GlobalLoading.tsx
```

---

### ✅ Spec 2-1: ノートページ基本レイアウト (champion-note-basic)
**状態**: 完了

**内容**:
- タブナビゲーション (新規ノート作成・汎用ノート・チャンピオン対策ノート)
- 左サイドバーのチャンピオン選択UI
  - 自分/相手のチャンピオン選択ボックス
  - 選択モード管理 (自動切り替え)
  - チャンピオン検索
  - よく使うチャンピオン (横スクロール)
  - チャンピオン一覧 (日本名 + 英名表示)
  - リセットボタン (両方選択時)
- 各タブのプレースホルダー表示
- チャンピオンデータ (171チャンピオン)

**ファイル**:
```
frontend/src/app/notes/page.tsx
frontend/src/components/notes/TabNavigation.tsx
frontend/src/components/notes/ChampionSelectorSidebar.tsx
frontend/src/components/notes/ChampionButton.tsx
frontend/src/components/notes/FavoriteChampions.tsx
frontend/src/components/notes/TabContentPlaceholder.tsx
frontend/src/types/champion.ts
frontend/src/lib/data/champions.ts
```

---

### ✅ Spec 3-1: ノートデータベース設計 (note-database-design)
**状態**: 完了

**内容**:
- Supabaseテーブル設計
  - notes テーブル
  - note_runes テーブル
  - note_items テーブル
  - note_summoner_spells テーブル
- Row Level Security (RLS) ポリシー
- インデックス設計

**ファイル**:
```
.kiro/specs/note-database-design/requirements.md
.kiro/specs/note-database-design/design.md
.kiro/specs/note-database-design/tasks.md
```

---

## 次に実装するSpec

### ⬜ Spec 2-2A: ノート一覧・作成機能
**目的**: チャンピオン対策ノートの一覧表示と新規作成機能

**内容**:
- **ノート一覧表示**
  - 選択したチャンピオンペアのノート一覧
  - カード形式表示（チャンピオンアイコン + プリセット名）
  - 作成日時・更新日時表示
  - 「新規ノート作成」ボタン
- **新規作成フォーム**
  - プリセット名入力
  - ルーン選択UI (RuneSelector)
    - メインルーン (キーストーン + 3つのルーン)
    - サブルーン (2つのルーン)
    - ステータスシャード (3つ)
  - サモナースペル選択 (SummonerSpellPicker) - 2つ
  - 初期アイテム選択 (ItemBuildSelector) - 複数
  - 対策メモ入力
  - 保存ボタン
- **Supabase連携**
  - ノート作成API
  - ノート一覧取得API
- **トースト通知**
  - 成功・失敗メッセージ表示

**理由**: 基本的なCRUD操作のうち、Create（作成）とRead（一覧）を先に実装

**期間**: 6-8時間

**依存**: Spec 2-1, Spec 3-1

**ファイル**:
```
frontend/src/components/notes/NoteList.tsx
frontend/src/components/notes/NoteCard.tsx
frontend/src/components/notes/NoteForm.tsx
frontend/src/components/notes/RuneSelector.tsx
frontend/src/components/notes/SummonerSpellPicker.tsx
frontend/src/components/notes/ItemBuildSelector.tsx
frontend/src/components/ui/Toast.tsx
frontend/src/lib/data/runeData.ts
frontend/src/lib/data/summonerSpells.ts
frontend/src/lib/data/items.ts
frontend/src/lib/api/notes.ts
```

---

### ⬜ Spec 2-2B: ノート編集・削除機能
**目的**: 既存ノートの閲覧・編集・削除機能

**内容**:
- **ノート閲覧画面**
  - 一覧へ戻るボタン（左矢印アイコン + テキスト）
  - チャンピオンアイコン + マッチアップ情報表示
  - 保存・編集・削除ボタン
  - フォーム内容表示（閲覧モード）
- **ノート編集機能**
  - 編集ボタンクリックでフォームを編集可能状態に
  - 保存ボタンで更新処理
  - Supabase連携（UPDATE）
- **ノート削除機能**
  - 削除ボタン
  - 削除確認ダイアログ
  - Supabase連携（DELETE）
- **トースト通知**
  - 更新・削除の成功・失敗メッセージ

**理由**: Update（編集）とDelete（削除）を分離し、段階的に実装

**期間**: 4-6時間

**依存**: Spec 2-2A

**ファイル**:
```
frontend/src/components/notes/NoteForm.tsx (編集モード追加)
frontend/src/components/notes/DeleteConfirmDialog.tsx
frontend/src/lib/api/notes.ts (更新・削除API追加)
```

---

### ⬜ Spec 2-3: 汎用ノート機能
**目的**: チャンピオンに依存しない汎用ノートの管理

**内容**:
- 汎用ノート作成フォーム
- 汎用ノート一覧表示
- 汎用ノート編集・削除
- タグ機能

**理由**: チャンピオン対策以外のメモ機能

**期間**: 4-6時間

**依存**: Spec 2-2

**ファイル**:
```
frontend/src/components/notes/GeneralNoteForm.tsx
frontend/src/components/notes/GeneralNoteList.tsx
```

---

### ⬜ Spec 2-4: サモナー検索機能
**目的**: プロダクトのもう1つのメイン機能

**内容**:
- SearchBar (検索入力、送信)
- RecentChips (最近の検索履歴)
- PinnedChips (ピン留めチャンピオン)
- ローカルストレージ管理
- ホームページ統合

**理由**: プロダクトのメイン機能

**期間**: 4-6時間

**依存**: Spec 1-1, 1-2

**ファイル**:
```
frontend/src/app/page.tsx
frontend/src/components/SearchBar.tsx
frontend/src/components/RecentChips.tsx
frontend/src/components/PinnedChips.tsx
frontend/src/lib/storage.ts
```

---

## 推奨実装順序（優先度順）

### 最優先（MVP完成）
1. ✅ **Spec 1-1: 基本UIレイアウト**
2. ✅ **Spec 1-2: 共通コンポーネント**
3. ✅ **Spec 2-1: ノートページ基本レイアウト**
4. ✅ **Spec 3-1: ノートデータベース設計**

### 次優先（ノート機能完成）
5. ⬜ **Spec 2-2A: ノート一覧・作成機能**
6. ⬜ **Spec 2-2B: ノート編集・削除機能**
7. ⬜ **Spec 2-3: 汎用ノート機能**

### その後（サモナー検索）
8. ⬜ **Spec 2-4: サモナー検索機能**

### 将来（拡張）
9. ⬜ **Spec 3-2: 検索・フィルタリング強化**
10. ⬜ **Spec 3-3: サモナー検索結果ページ**

---

## 実装の粒度

### 1つのSpecの目安
- **実装時間**: 4-10時間
- **ファイル数**: 3-8ファイル
- **コンポーネント数**: 2-5コンポーネント
- **機能の完結性**: 1つの機能が完全に動作する単位

### 粒度が適切な例
- ✅ Spec 2-1: タブナビゲーション + チャンピオン選択UI（完結した機能）
- ✅ Spec 2-2: ノート作成フォーム（ルーン・スペル・アイテム選択を含む）

### 粒度が不適切な例
- ❌ 「ボタンコンポーネント作成」（小さすぎる）
- ❌ 「ノート機能全体」（大きすぎる）

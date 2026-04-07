# Spec実装計画

## 概要

現状の手動実装を削除し、Kiroに体系的に再構築させるための実装順序を定義します。

---

## 現状の実装分析

### 実装済み機能
1. **基本レイアウト** (Layout, Navbar, Footer)
2. **ホームページ** (SearchBar, RecentChips, PinnedChips)
3. **ノート管理** (ChampionNoteForm, RuneSelector, SummonerSpellPicker)
4. **共通コンポーネント** (GlobalLoading, Panel)
5. **データ管理** (storage.ts, champions.ts, items.ts, runeData.ts)
6. **認証** (NextAuth, Google OAuth)

---

## Phase 1: 基盤（Foundation）

### Spec 1-1: 基本UI構造
**目的**: アプリケーション全体の土台を構築

**内容**:
- RootLayout (layout.tsx)
- Navbar (ロゴ、ナビゲーション、認証ボタン/アバター)
- Footer (著作権表示)
- GlobalLoading (右下固定ローディング)
- グローバルスタイル (globals.css)

**理由**: 全ての画面で使用される共通構造

**期間**: 2-3時間

**依存**: なし

**ファイル**:
```
frontend/src/app/layout.tsx
frontend/src/app/globals.css
frontend/src/components/Navbar.tsx
frontend/src/components/Footer.tsx
frontend/src/components/GlobalLoading.tsx
```

---

### Spec 1-2: 共通コンポーネント
**目的**: 他の機能で再利用される基本部品を構築

**内容**:
- Panel (汎用パネルコンテナ)
- ボタンスタイル定数 (ITEM_BTN_BASE, ITEM_BTN_ACTIVE等)
- itemBtnClass ユーティリティ関数
- 入力フィールドスタイル定数 (BORDER_STYLE_1)

**理由**: 他の機能で再利用される基本部品

**期間**: 1-2時間

**依存**: Spec 1-1

**ファイル**:
```
frontend/src/components/ui/Panel.tsx
```

---

### Spec 1-3: 認証システム
**目的**: ユーザー固有データの前提条件を構築

**内容**:
- NextAuth設定
- Google OAuth連携
- セッション管理
- ユーザーID取得・保存

**理由**: ユーザー固有データの前提条件

**期間**: 2-3時間

**依存**: Spec 1-1

**ファイル**:
```
frontend/src/app/api/auth/[...nextauth]/route.ts
frontend/src/app/providers.tsx
```

---

## Phase 2: コア機能（Core Features）

### Spec 2-1: サモナー検索機能
**目的**: プロダクトのメイン機能の1つを実装

**内容**:
- SearchBar (検索入力、送信)
- RecentChips (最近の検索履歴)
- PinnedChips (ピン留めチャンピオン)
- ローカルストレージ管理 (storage.ts)
- ホームページ統合 (page.tsx)

**理由**: プロダクトのメイン機能の1つ

**期間**: 4-6時間

**依存**: Spec 1-1, 1-2, 1-3

**ファイル**:
```
frontend/src/app/page.tsx
frontend/src/components/SearchBar.tsx
frontend/src/components/RecentChips.tsx
frontend/src/components/PinnedChips.tsx
frontend/src/lib/storage.ts
```

**将来拡張**:
- 検索結果ページ (app/search/page.tsx)
- Riot API連携

---

### Spec 2-2: チャンピオンノート管理（基本）
**目的**: もう1つのメイン機能を実装

**内容**:
- ノート一覧表示
- ノート作成フォーム（基本情報のみ）
  - マイチャンピオン選択
  - 敵チャンピオン選択
- ノート編集
- ノート削除
- Supabase連携

**理由**: もう1つのメイン機能

**期間**: 4-6時間

**依存**: Spec 1-1, 1-2, 1-3

**ファイル**:
```
frontend/src/app/notes/page.tsx
frontend/src/app/notes/createNote/page.tsx
frontend/src/lib/champions.ts
frontend/src/lib/supabase.ts
```

---

### Spec 2-3: チャンピオンノート管理（詳細）
**目的**: ノート機能の完成

**内容**:
- RuneSelector (ルーン選択UI)
- SummonerSpellPicker (スペル選択)
- アイテム選択グリッド
- 対策メモ入力
- ChampionNoteForm統合

**理由**: ノート機能の完成

**期間**: 6-8時間

**依存**: Spec 2-2

**ファイル**:
```
frontend/src/app/notes/components/ChampionNoteForm.tsx
frontend/src/app/notes/components/RuneSelector.tsx
frontend/src/app/notes/components/summoners/SummonerSpellPicker.tsx
frontend/src/lib/runeData.ts
frontend/src/lib/items.ts
frontend/src/lib/summonerSpells.ts
```

---

## Phase 3: 拡張機能（Enhancements）

### Spec 3-1: 検索・フィルタリング
**目的**: ユーザー体験の向上

**内容**:
- ノート検索
- チャンピオンフィルター
- ソート機能

**理由**: データが増えた時の利便性

**期間**: 3-4時間

**依存**: Spec 2-2

---

### Spec 3-2: お気に入り・タグ機能
**目的**: 情報整理の強化

**内容**:
- ノートのお気に入り
- タグ付け
- タグフィルター

**理由**: 情報整理の強化

**期間**: 2-3時間

**依存**: Spec 2-2

---

## 推奨実装順序（優先度順）

### 最優先（MVP）
1. ✅ **Spec 1-1: 基本UI構造** ← まずこれ
2. ✅ **Spec 1-2: 共通コンポーネント**
3. ✅ **Spec 1-3: 認証システム**
4. ✅ **Spec 2-1: サモナー検索機能**
5. ✅ **Spec 2-2: チャンピオンノート管理（基本）**

### 次優先（完成版）
6. ⬜ **Spec 2-3: チャンピオンノート管理（詳細）**

### 将来（拡張）
7. ⬜ **Spec 3-1: 検索・フィルタリング**
8. ⬜ **Spec 3-2: お気に入り・タグ機能**

---

## 実装戦略

### 削除対象
Phase 1-2の実装開始前に以下を削除:
```
frontend/src/app/layout.tsx
frontend/src/app/page.tsx
frontend/src/app/globals.css
frontend/src/components/Navbar.tsx
frontend/src/components/Footer.tsx
frontend/src/components/GlobalLoading.tsx
frontend/src/components/SearchBar.tsx
frontend/src/components/RecentChips.tsx
frontend/src/components/PinnedChips.tsx
frontend/src/components/ui/Panel.tsx
frontend/src/app/notes/ (全体)
```

### 保持対象
以下は削除せず、参照用として保持:
```
frontend/src/lib/champions.ts (データ定義)
frontend/src/lib/items.ts (データ定義)
frontend/src/lib/runeData.ts (データ定義)
frontend/src/lib/summonerSpells.ts (データ定義)
frontend/src/lib/supabase.ts (設定)
frontend/src/app/api/auth/ (認証設定)
frontend/src/app/providers.tsx (プロバイダー設定)
```

### 参考資料
- `ui-patterns.md`: UIパターンの詳細実装例
- `docs/`: プロダクト要件、設計書
- `.kiro/steering/`: 技術スタック、コーディング規約

---

## 次のアクション

1. **Spec 1-1を作成**
   - 基本UI構造のSpec作成
   - Requirements-First または Design-First を選択
   - Kiroに実装させる

2. **順次進める**
   - 各Specを順番に作成・実装
   - 前のSpecが完了してから次へ

3. **検証**
   - 各Spec完了後に動作確認
   - 必要に応じて調整

---

## メモ

- **UI/UXは現状維持**: 技術スタック、デザインシステムは変更しない
- **コーディング品質向上**: Kiroに作らせることで一貫性とベストプラクティスを確保
- **段階的実装**: 一度に全部作らず、Specごとに確実に進める

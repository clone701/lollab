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
4. ✅ **Spec 2-1: サモナー検索機能**
5. ✅ **Spec 2-2: チャンピオンノート管理（基本）**

### 次優先（完成版）
6. ⬜ **Spec 2-3: チャンピオンノート管理（詳細）**

### 将来（拡張）
7. ⬜ **Spec 3-1: 検索・フィルタリング**
8. ⬜ **Spec 3-2: お気に入り・タグ機能**

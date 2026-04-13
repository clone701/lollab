# 設計書: ノート一覧・作成機能

## 概要

本ドキュメントは、チャンピオン対策ノートの一覧表示と新規作成機能の技術設計を定義します。

本機能は、Spec 2-1で実装した基本レイアウトとチャンピオン選択UIを活用し、ノートの作成と一覧表示機能を提供します。

**編集・削除機能はSpec 2-2Bで実装します。**

## アーキテクチャ

### システム構成

```
NotesPage (状態管理)
├── NoteList (一覧表示)
│   └── NoteCard (カード表示)
├── NoteForm (作成フォーム)
│   ├── RuneSelector (ルーン選択)
│   ├── SummonerSpellPicker (スペル選択)
│   └── ItemBuildSelector (アイテム選択)
└── Toast (通知)
```

### データフロー

```
ユーザー → チャンピオン選択
  ↓
NotesPage → NoteList → Supabase (ノート取得)
  ↓
ノート一覧表示

ユーザー → 新規ノート作成クリック
  ↓
NotesPage → NoteForm表示
  ↓
ユーザー → フォーム入力 → 保存
  ↓
NoteForm → Supabase (ノート作成)
  ↓
Toast通知 → 一覧更新
```

## コンポーネント設計

### NotesPage

**場所**: `frontend/src/app/notes/page.tsx`

**責務**: ノートページ全体の状態管理とレイアウト

**状態**:
```typescript
interface NotesPageState {
  activeTab: 'create' | 'general' | 'matchup';
  myChampionId: string | null;
  enemyChampionId: string | null;
  showForm: boolean;
  loading: boolean;
}
```

**主要機能**:
- タブナビゲーション表示（Spec 2-1から継承）
- 左サイドバー表示制御（Spec 2-1から継承）
- チャンピオン選択状態の管理
- ノート一覧とフォームの切り替え

### NoteList

**場所**: `frontend/src/components/notes/NoteList.tsx`

**責務**: ノート一覧の表示と管理

**Props**:
```typescript
interface NoteListProps {
  myChampionId: string | null;
  enemyChampionId: string | null;
  onCreateNew: () => void;
}
```

**状態**:
```typescript
interface NoteListState {
  notes: ChampionNote[];
  loading: boolean;
  error: string | null;
}
```

**機能**:
- Supabaseからノート一覧を取得
- ローディング状態の表示
- エラー状態の表示
- 空状態の表示
- 新規ノート作成ボタン

### NoteCard

**場所**: `frontend/src/components/notes/NoteCard.tsx`

**責務**: 個別ノートのカード表示

**Props**:
```typescript
interface NoteCardProps {
  note: ChampionNote;
}
```

**表示内容**:
- チャンピオンアイコン（自分 vs 相手）
- プリセット名
- 作成日時
- 更新日時

**注意**: 本Specではノートカードのクリックイベントは実装しません。閲覧・編集機能はSpec 2-2Bで実装します。

### NoteForm

**場所**: `frontend/src/components/notes/NoteForm.tsx`

**責務**: ノート作成フォームの表示と入力管理

**Props**:
```typescript
interface NoteFormProps {
  myChampionId: string;
  enemyChampionId: string;
  onCancel: () => void;
  onSave: () => void;
}
```

**状態**:
```typescript
interface NoteFormState {
  presetName: string;
  runes: RuneConfig | null;
  runeKey: number; // ルーンコンポーネントのリセット用キー
  spells: string[];
  items: string[];
  memo: string;
  errors: Record<string, string>;
  saving: boolean;
}
```

**バリデーション**:
- プリセット名: 100文字以内（空でもOK、デフォルト名を自動設定）
- 対策メモ: 10,000文字以内

**機能**:
- プリセット名入力
- ルーン選択（RuneSelector）
- サモナースペル選択（SummonerSpellPicker）
- 初期アイテム選択（ItemBuildSelector）
- 対策メモ入力
- 保存処理
- キャンセル処理
- 各セクションのリセットボタン

### RuneSelector

**場所**: `frontend/src/components/notes/RuneSelector.tsx`

**責務**: ルーン選択UIの表示と管理

**Props**:
```typescript
interface RuneSelectorProps {
  value: RuneConfig | null;
  onChange: (runes: RuneConfig) => void;
}

interface RuneConfig {
  primaryPath: number;
  secondaryPath: number;
  keystone: number;
  primaryRunes: number[]; // 3つ
  secondaryRunes: number[]; // 2つ、異なる行から
  shards: number[]; // 3つ
}
```

**機能**:
- Primaryルーンパス選択
- キーストーン選択
- Primaryルーン選択（3段階）
- Secondaryルーンパス選択
- Secondaryルーン選択（2つ、異なる行から）
- Shards選択（3段階）
- value=nullでリセット対応

**UI構成**:
- 3カラムレイアウト（Primary / Secondary / Shards）
- 選択状態: 黒ボーダー + グレー背景
- 未選択状態: 透明ボーダー
- ホバー状態: グレーボーダー

### SummonerSpellPicker

**場所**: `frontend/src/components/notes/SummonerSpellPicker.tsx`

**責務**: サモナースペル選択UIの表示と管理

**Props**:
```typescript
interface SummonerSpellPickerProps {
  value: string[];
  onChange: (spells: string[]) => void;
}
```

**機能**:
- 最大2つまで選択可能
- クリックで選択/解除
- 2つ選択済みの場合は最初のスペルを置き換え

**UI構成**:
- グリッドレイアウト（2-4-6カラム、レスポンシブ）
- 選択状態: 黒ボーダー + グレー背景
- 未選択状態: 透明ボーダー
- ホバー状態: グレーボーダー

### ItemBuildSelector

**場所**: `frontend/src/components/notes/ItemBuildSelector.tsx`

**責務**: 初期アイテム選択UIの表示と管理

**Props**:
```typescript
interface ItemBuildSelectorProps {
  value: string[];
  onChange: (items: string[]) => void;
}
```

**機能要件**:
1. **500g制限**: 選択したアイテムの合計金額が500gを超える場合、追加選択不可
2. **数量表示**: 同じアイテムを複数選択した場合、右上に「x2」「x3」などの数量バッジを表示
3. **選択不可UI**: 500g超過により選択できないアイテムは、opacity-50 + cursor-not-allowedで視覚的に無効化
4. **複数選択**: 通常クリックで追加、Shift+クリックまたは右クリックで削除

**UI構成**:
- 合計金額表示（500g超過時は赤色）
- グリッドレイアウト（3-4-6カラム、レスポンシブ）
- 選択状態: 黒ボーダー + ピンク背景
- 未選択状態: グレーボーダー
- 選択不可状態: グレーボーダー + opacity-50

### Toast

**場所**: `frontend/src/components/notes/Toast.tsx`

**責務**: トースト通知の表示

**Props**:
```typescript
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}
```

**機能**:
- 3秒間表示後に自動的に閉じる
- 画面右上に固定表示
- タイプ別の背景色（success: 緑、error: 赤、info: 青）

## データ型定義

### ChampionNote

```typescript
interface ChampionNote {
  id: string;
  user_id: string;
  my_champion_id: string;
  enemy_champion_id: string;
  preset_name: string;
  runes: RuneConfig | null;
  spells: string[];
  items: string[];
  memo: string;
  created_at: string;
  updated_at: string;
}
```

### RuneConfig

```typescript
interface RuneConfig {
  primaryPath: number;
  secondaryPath: number;
  keystone: number;
  primaryRunes: number[];
  secondaryRunes: number[];
  shards: number[];
}
```

## API設計

### getNotes

**場所**: `frontend/src/lib/api/notes.ts`

**シグネチャ**:
```typescript
async function getNotes(
  myChampionId: string,
  enemyChampionId: string,
  userId: string
): Promise<ChampionNote[]>
```

**処理内容**:
- Supabaseからノート一覧を取得
- my_champion_id, enemy_champion_id, user_idでフィルタリング
- created_at降順でソート

### createNote

**場所**: `frontend/src/lib/api/notes.ts`

**シグネチャ**:
```typescript
interface CreateNoteData {
  my_champion_id: string;
  enemy_champion_id: string;
  preset_name: string;
  runes: RuneConfig | null;
  spells: string[];
  items: string[];
  memo: string;
}

async function createNote(
  data: CreateNoteData,
  userId: string
): Promise<ChampionNote>
```

**処理内容**:
- Supabaseにノートを作成
- user_idを自動設定
- created_at, updated_atを現在時刻に設定

## ルーンデータ構造

### RUNE_PATHS

```typescript
interface RunePath {
  id: number;
  name: string;
  icon: string;
}

const RUNE_PATHS: RunePath[] = [
  { id: 8000, name: 'Precision', icon: '/images/runes/precision/icon.png' },
  { id: 8100, name: 'Domination', icon: '/images/runes/domination/icon.png' },
  { id: 8200, name: 'Sorcery', icon: '/images/runes/sorcery/icon.png' },
  { id: 8300, name: 'Resolve', icon: '/images/runes/resolve/icon.png' },
  { id: 8400, name: 'Inspiration', icon: '/images/runes/inspiration/icon.png' },
];
```

### KEYSTONES

```typescript
interface Rune {
  id: number;
  name: string;
  icon: string;
}

const KEYSTONES: Record<number, Rune[]> = {
  8000: [ /* Precision keystones */ ],
  8100: [ /* Domination keystones */ ],
  8200: [ /* Sorcery keystones */ ],
  8300: [ /* Resolve keystones */ ],
  8400: [ /* Inspiration keystones */ ],
};
```

### PRIMARY_RUNES

```typescript
const PRIMARY_RUNES: Record<number, Record<number, Rune[]>> = {
  8000: {
    0: [ /* Precision slot 0 runes */ ],
    1: [ /* Precision slot 1 runes */ ],
    2: [ /* Precision slot 2 runes */ ],
  },
  // 他のパスも同様
};
```

### SHARDS

```typescript
const SHARDS: Record<number, Rune[]> = {
  0: [ /* Offense shards */ ],
  1: [ /* Flex shards */ ],
  2: [ /* Defense shards */ ],
};
```

### ヘルパー関数

```typescript
function getKeystones(pathId: number): Rune[]
function getPrimaryRunes(pathId: number, slot: number): Rune[]
function getSecondaryRunes(pathId: number): Rune[]
function getRuneSlot(pathId: number, runeId: number): number | null
function getShards(slot: number): Rune[]
```

## サモナースペルデータ

```typescript
interface SummonerSpell {
  id: string;
  name: string;
  icon: string;
}

const SUMMONER_SPELLS: SummonerSpell[] = [
  { id: 'flash', name: 'Flash', icon: '/images/spells/flash.png' },
  { id: 'ignite', name: 'Ignite', icon: '/images/spells/ignite.png' },
  // 他のスペル
];
```

## 初期アイテムデータ

```typescript
interface StarterItem {
  id: string;
  name: string;
  icon: string;
  gold: number;
}

const STARTER_ITEMS: StarterItem[] = [
  { id: '1001', name: 'Boots', icon: '/images/item/1001.png', gold: 300 },
  { id: '1004', name: 'Faerie Charm', icon: '/images/item/1004.png', gold: 250 },
  // 他のアイテム
];
```

## UI/UXデザイン

### レイアウト

- タブナビゲーション（Spec 2-1）
- 左サイドバー（Spec 2-1）
- 右メインエリア
  - ノート一覧 or ノート作成フォーム

### カラースキーム

- 選択状態: 黒ボーダー + グレー背景
- 未選択状態: 透明ボーダー
- ホバー状態: グレーボーダー
- アイテム選択状態: 黒ボーダー + ピンク背景

### レスポンシブ対応

- モバイル（768px未満）: 1カラムレイアウト
- タブレット（768px以上）: 2カラムレイアウト
- デスクトップ（1024px以上）: 3カラムレイアウト

## エラーハンドリング

### エラー種別

| エラー種別 | 検出場所 | 表示方法 |
|-----------|---------|---------|
| ネットワークエラー | API呼び出し | Toast通知 |
| データベースエラー | Supabase操作 | Toast通知 |
| バリデーションエラー | フォーム送信 | フォーム内表示 |
| 認証エラー | RLSポリシー | Toast通知 |

### エラーメッセージ

- ノート取得失敗: 「ノートの取得に失敗しました」
- ノート作成失敗: 「ノートの作成に失敗しました」
- バリデーションエラー: 「入力内容を確認してください」

## パフォーマンス最適化

### 最適化方針

- React.memoでコンポーネントをメモ化
- useCallbackでコールバック関数をメモ化
- useMemoで計算結果をメモ化
- 画像のlazy loading

### データ取得の最適化

- ローディング状態の管理
- エラー状態の管理
- 不要な再取得の防止

## セキュリティ

### 認証チェック

- ページレベルでセッションチェック
- 未認証の場合はログイン画面にリダイレクト

### RLSポリシー

- Supabase RLSポリシーでuser_idをチェック
- 他のユーザーのノートは取得・作成不可

### 入力検証

- フロントエンドでバリデーション
- バックエンド（RLS）で二重チェック

## 実装順序

1. **Phase 1: データ型定義**
   - ChampionNote型
   - RuneConfig型
   - ルーンデータ定義

2. **Phase 2: API実装**
   - getNotes実装
   - createNote実装

3. **Phase 3: UIコンポーネント**
   - NoteList実装
   - NoteCard実装
   - Toast実装

4. **Phase 4: フォームコンポーネント**
   - NoteForm実装
   - RuneSelector実装
   - SummonerSpellPicker実装
   - ItemBuildSelector実装

5. **Phase 5: ページ統合**
   - NotesPage実装
   - 状態管理実装
   - エラーハンドリング実装

## 技術的制約

- Next.js 15 (App Router)
- TypeScript 5
- React 19
- Tailwind CSS 4
- Supabase Client
- Spec 2-1の基本レイアウトを継承
- Spec 3-1のchampion_notesテーブルを使用

## 依存関係

- **Spec 2-1**: TabNavigation, ChampionSelectorSidebar
- **Spec 3-1**: champion_notesテーブル、RLSポリシー
- **Spec 1-1**: 認証システム
- **Spec 1-2**: Panel, GlobalLoading

## 非機能要件

- ノート一覧表示: 1秒以内
- ノート作成処理: 2秒以内
- モバイル対応: 768px未満で1カラムレイアウト

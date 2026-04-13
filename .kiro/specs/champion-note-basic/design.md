# 設計書: ノートページ基本レイアウト

## 概要

本ドキュメントは、LoL Labアプリケーションのノートページ（`/notes`）の基本レイアウトとタブナビゲーションの設計を定義します。この機能は、ノート管理システムの土台となるUI骨組みを提供します。

本Specでは、以下のみを実装します：
- タブナビゲーション（対策ノート・汎用ノート）
- 左サイドバーのチャンピオン選択UI
- 各タブのプレースホルダー表示

**実際のノート作成・編集・一覧表示機能は別Specで実装します。**

## アーキテクチャ

### ページレイアウト構造

```
┌─────────────────────────────────────────────────────────┐
│ Navbar (既存)                                            │
├─────────────────────────────────────────────────────────┤
│ Tab Navigation                                           │
│ [対策ノート] [汎用ノート]                                │
├──────────────────┬──────────────────────────────────────┤
│                  │                                      │
│  Champion        │  Tab Content Area                    │
│  Selector        │                                      │
│  Sidebar         │  (プレースホルダー表示)              │
│                  │                                      │
│  - 自分選択      │                                      │
│  - 相手選択      │                                      │
│  - よく使う      │                                      │
│  - 一覧          │                                      │
│                  │                                      │
└──────────────────┴──────────────────────────────────────┘
```

### 状態管理

```typescript
interface NotesPageState {
  activeTab: 'create' | 'general' | 'matchup';
  myChampionId: string | null;
  enemyChampionId: string | null;
  loading: boolean;
  sidebarOpen: boolean; // モバイル用
}
```

## コンポーネント設計

### NotesPage

**場所**: `frontend/src/app/notes/page.tsx`

**責務**: ノートページ全体のレイアウトとタブ管理

**状態**:
```typescript
interface NotesPageState {
  activeTab: 'create' | 'general' | 'matchup';
  myChampionId: string | null;
  enemyChampionId: string | null;
  loading: boolean;
  sidebarOpen: boolean;
}
```

**主要機能**:
- タブナビゲーション表示
- 左サイドバー表示制御（タブによって表示/非表示）
- チャンピオン選択状態の管理
- レスポンシブレイアウト

### TabNavigation

**場所**: `frontend/src/components/notes/TabNavigation.tsx`

**責務**: タブの表示と切り替え

**Props**:
```typescript
interface TabNavigationProps {
  activeTab: 'create' | 'general' | 'matchup';
  onTabChange: (tab: 'create' | 'general' | 'matchup') => void;
}
```

**タブ定義**:
```typescript
const tabs = [
  { id: 'matchup', label: '対策ノート' },
  { id: 'general', label: '汎用ノート' }
];
```

**スタイル仕様**:
- アクティブタブ: 下線 + 黒色
- 非アクティブタブ: グレー色 + ホバー効果

### ChampionSelectorSidebar

**場所**: `frontend/src/components/notes/ChampionSelectorSidebar.tsx`

**責務**: チャンピオン選択UI全体と選択モード管理

**Props**:
```typescript
interface ChampionSelectorSidebarProps {
  myChampionId: string | null;
  enemyChampionId: string | null;
  onMyChampionChange: (championId: string) => void;
  onEnemyChampionChange: (championId: string) => void;
}
```

**内部状態**:
```typescript
interface SidebarState {
  searchQuery: string;
  filteredChampions: Champion[];
  selectionMode: 'my' | 'enemy';
}
```

**選択フロー**:
1. 初期状態は「自分のチャンピオン選択」モード
2. 自分のチャンピオンを選択すると、自動的に「相手のチャンピオン選択」モードに切り替わる
3. 選択ボックスをクリックすると、そのモードに切り替わり変更可能
4. 両方のチャンピオンが選択されたら、検索バー以下を非表示にし、リセットボタンを表示
5. リセットボタンをクリックすると、両方の選択をクリアし、検索バー以下を再表示

**セクション構成**:
1. **自分のチャンピオンを選択**
   - クリック可能なボックス
   - 未選択時: 「自分のチャンピオンを選択」とグレーテキスト表示
   - 選択後: チャンピオン画像（48px）+ 「自分」ラベル + チャンピオン名
   - 選択モード時: 明るい青色（bg-blue-100, border-blue-400）でハイライト
   - 非選択モード時: グレー（bg-gray-50, border-gray-200）

2. **相手のチャンピオンを選択**
   - クリック可能なボックス
   - 未選択時: 「相手のチャンピオンを選択」とグレーテキスト表示
   - 選択後: チャンピオン画像（48px）+ 「相手」ラベル + チャンピオン名
   - 選択モード時: 明るい赤色（bg-red-100, border-red-400）でハイライト
   - 非選択モード時: グレー（bg-gray-50, border-gray-200）

3. **チャンピオン検索**
   - 検索入力欄（見出しなし）
   - リアルタイムフィルタリング
   - 両方のチャンピオンが選択されたら非表示

4. **よく使うチャンピオン**
   - 横スクロール可能なリスト
   - 円形チャンピオン画像
   - 最大10チャンピオン表示
   - 現在のモードに応じた選択状態を表示
   - 両方のチャンピオンが選択されたら非表示

5. **チャンピオン一覧**
   - スクロール可能なリスト
   - チャンピオン画像 + 日本名（左） + 英名（右・グレー）
   - 現在のモードに応じた選択状態のハイライト
   - 両方のチャンピオンが選択されたら非表示

6. **リセットボタン**
   - 両方のチャンピオンが選択されたときのみ表示
   - クリックすると両方の選択をクリア
   - ボーダーのみのボタン（bg-white border-2 border-gray-300 text-gray-700）

**スタイル**:
- サイドバー幅: 320px
- セクション間隔: 16px
- チャンピオン画像サイズ: 32px

### ChampionButton

**場所**: `frontend/src/components/notes/ChampionButton.tsx`

**責務**: 個別チャンピオンの選択ボタン

**Props**:
```typescript
interface ChampionButtonProps {
  champion: Champion;
  selected: boolean;
  onClick: () => void;
}
```

**スタイル仕様**:
- 選択状態: グレー背景 + 黒ボーダー
- 未選択状態: ホバー時にグレー背景
- 画像サイズ: 32px（円形）

### FavoriteChampions

**場所**: `frontend/src/components/notes/FavoriteChampions.tsx`

**責務**: よく使うチャンピオンの横スクロールリスト

**Props**:
```typescript
interface FavoriteChampionsProps {
  champions: Champion[];
  selectedId: string | null;
  onSelect: (championId: string) => void;
}
```

**スタイル仕様**:
- 横スクロール可能
- 画像サイズ: 48px（円形）
- 選択状態: 黒リング

### TabContentPlaceholder

**場所**: `frontend/src/components/notes/TabContentPlaceholder.tsx`

**責務**: 各タブのプレースホルダー表示

**Props**:
```typescript
interface TabContentPlaceholderProps {
  tab: 'create' | 'general' | 'matchup';
  myChampionId: string | null;
  enemyChampionId: string | null;
}
```

**表示内容**:
- 対策ノートタブ: 「チャンピオンを選択してください」
- 汎用ノートタブ: 「汎用ノート機能は別Specで実装予定です」

## データモデル

### Champion型

```typescript
interface Champion {
  id: string;        // チャンピオンID（例: "Ahri", "Zed"）
  name: string;      // 表示名（例: "アーリ", "ゼド"）
  imagePath: string; // 画像パス（例: "/images/champion/Ahri.png"）
}
```

### チャンピオンデータ

**場所**: `frontend/src/lib/data/champions.ts`

```typescript
export const champions: Champion[] = [
  { id: 'Aatrox', name: 'エイトロックス', imagePath: '/images/champion/Aatrox.png' },
  { id: 'Ahri', name: 'アーリ', imagePath: '/images/champion/Ahri.png' },
  // ... 全171チャンピオン
];

export const favoriteChampions: Champion[] = [
  // よく使うチャンピオン（仮データ）
];
```

### タブ型定義

```typescript
type TabType = 'create' | 'general' | 'matchup';

interface Tab {
  id: TabType;
  label: string;
  showSidebar: boolean;
}

const tabs: Tab[] = [
  { id: 'matchup', label: '対策ノート', showSidebar: true },
  { id: 'general', label: '汎用ノート', showSidebar: false }
];
```

## スタイリング設計

### カラーパレット

- 選択状態: グレー背景 + 黒ボーダー
- 自分のチャンピオン選択モード: 青背景 + 青ボーダー
- 相手のチャンピオン選択モード: 赤背景 + 赤ボーダー
- 未選択状態: グレー背景 + グレーボーダー

### レイアウト定数

- サイドバー幅: 320px
- コンテンツパディング: 16px
- セクション間隔: 16px
- チャンピオン画像サイズ: 32px
- よく使うチャンピオン画像サイズ: 48px

### レスポンシブブレークポイント

- モバイル: 768px未満
- タブレット: 768px以上
- デスクトップ: 1024px以上

## 認証設計

### NextAuth.js統合

**セッション確認**:
- ローディング中: GlobalLoading表示
- 未認証: ログインメッセージ表示
- 認証済み: ユーザーIDを状態管理に使用

**認証フロー**:
1. ページアクセス時にセッション確認
2. 未認証の場合はログインメッセージとログインボタンを表示
3. 認証済みの場合はユーザーIDを状態管理に使用

## パフォーマンス最適化

### 最適化方針

- React.memoでコンポーネントをメモ化
- useCallbackでコールバック関数をメモ化
- useMemoでフィルタリング結果をメモ化
- 画像のlazy loading

### チャンピオンデータのキャッシング

- チャンピオンデータは静的ファイルから読み込み
- 初回読み込み後はメモリ上にキャッシュ

## レスポンシブデザイン

### レイアウト調整

**デスクトップ**:
- サイドバー + メインエリア（横並び）
- サイドバー幅: 320px

**モバイル**:
- サイドバーはオーバーレイ表示
- ハンバーガーメニューで開閉

**タブナビゲーション**:
- デスクトップ: 横並び
- モバイル: 適切なフォントサイズとパディング

## フォント設定

### Noto Sans JP

プロジェクト全体で使用する日本語フォント

**場所**: `frontend/src/app/layout.tsx`

```typescript
import { Noto_Sans_JP } from 'next/font/google';

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-sans-jp',
});
```

**Tailwind設定**: `frontend/tailwind.config.js`

```javascript
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Noto Sans JP', 'sans-serif'],
      },
    },
  },
}
```

## ファイル構造

```
frontend/src/
├── app/
│   ├── layout.tsx                      # ルートレイアウト（フォント設定）
│   └── notes/
│       └── page.tsx                    # ノートページ
├── components/
│   └── notes/
│       ├── TabNavigation.tsx           # タブナビゲーション
│       ├── ChampionSelectorSidebar.tsx # 左サイドバー
│       ├── ChampionButton.tsx          # チャンピオン選択ボタン
│       ├── FavoriteChampions.tsx       # よく使うチャンピオン
│       └── TabContentPlaceholder.tsx   # タブコンテンツプレースホルダー
└── lib/
    └── data/
        └── champions.ts                # チャンピオンデータ
```

## 実装順序

1. **Phase 1: データ準備**
   - チャンピオンデータファイル作成
   - Champion型定義

2. **Phase 2: 基本コンポーネント**
   - ChampionButton
   - FavoriteChampions
   - TabNavigation

3. **Phase 3: サイドバー実装**
   - ChampionSelectorSidebar
   - チャンピオン検索機能
   - チャンピオン一覧表示

4. **Phase 4: ページ統合**
   - Notes Page
   - タブ切り替え機能
   - サイドバー表示制御
   - プレースホルダー表示

5. **Phase 5: レスポンシブ対応**
   - モバイルレイアウト
   - サイドバーオーバーレイ
   - ハンバーガーメニュー

## 依存関係

- **Spec 1-1**: ルートレイアウト、ナビゲーションバー、認証システム
- **Spec 1-2**: Panel、GlobalLoading、スタイル定数

## 技術的制約

- Next.js 15 (App Router)
- TypeScript 5
- React 19
- Tailwind CSS 4
- NextAuth.js 4

## 今後の拡張（別Spec）

以下の機能は本Specの範囲外とし、別Specで実装します：

- ノート作成機能
- 汎用ノート機能
- ノート一覧・編集機能

本Specでは、これらの機能のプレースホルダーのみを表示します。

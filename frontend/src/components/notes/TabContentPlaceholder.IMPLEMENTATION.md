# TabContentPlaceholder実装ドキュメント

## 概要

TabContentPlaceholderコンポーネントは、ノートページの各タブに対応するプレースホルダーメッセージを表示するコンポーネントです。

## 実装内容

### コンポーネント構造

```tsx
TabContentPlaceholder
├── Props
│   ├── tab: 'create' | 'general' | 'matchup'
│   ├── myChampionId: string | null
│   └── enemyChampionId: string | null
└── 表示内容（タブごとに異なる）
    ├── 新規ノート作成: チャンピオン選択を促すメッセージ
    ├── 汎用ノート: 別Spec実装予定のメッセージ
    └── チャンピオン対策ノート: チャンピオン選択と別Spec実装予定のメッセージ
```

### タブごとの表示内容

#### 新規ノート作成タブ（'create'）

```
チャンピオンを選択してください
左のパネルで自分のチャンピオンと相手のチャンピオンを選択してください
```

#### 汎用ノートタブ（'general'）

```
汎用ノート機能
汎用ノート機能は別Specで実装予定です
```

#### チャンピオン対策ノートタブ（'matchup'）

```
チャンピオンを選択してください
対策ノート一覧機能は別Specで実装予定です
```

## 使用方法

### 基本的な使用例

```tsx
import TabContentPlaceholder from '@/components/notes/TabContentPlaceholder';

function NotesPage() {
  const [activeTab, setActiveTab] = useState<'create' | 'general' | 'matchup'>(
    'create'
  );
  const [myChampionId, setMyChampionId] = useState<string | null>(null);
  const [enemyChampionId, setEnemyChampionId] = useState<string | null>(null);

  return (
    <div>
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      <TabContentPlaceholder
        tab={activeTab}
        myChampionId={myChampionId}
        enemyChampionId={enemyChampionId}
      />
    </div>
  );
}
```

## 要件との対応

### 要件7: 新規ノート作成タブのコンテンツ

- ✅ 7.1: 左サイドバーを表示（親コンポーネントで制御）
- ✅ 7.2: 右側にプレースホルダーメッセージを表示
- ✅ 7.3: 「チャンピオンを選択してください」メッセージを表示
- ✅ 7.4: 「左のパネルで...」説明を表示

### 要件8: 汎用ノートタブのコンテンツ

- ✅ 8.1: プレースホルダーメッセージを表示
- ✅ 8.2: 「汎用ノート機能は別Specで実装予定です」メッセージを表示
- ✅ 8.3: 左サイドバーを非表示（親コンポーネントで制御）

### 要件9: チャンピオン対策ノートタブのコンテンツ

- ✅ 9.1: 左サイドバーを表示（親コンポーネントで制御）
- ✅ 9.2: 右側にプレースホルダーメッセージを表示
- ✅ 9.3: 「チャンピオンを選択してください」メッセージを表示
- ✅ 9.4: 「対策ノート一覧機能は別Specで実装予定です」説明を表示

## テスト

### テストケース

1. **新規ノート作成タブ**: チャンピオン選択を促すメッセージを表示する
2. **汎用ノートタブ**: 別Spec実装予定のメッセージを表示する
3. **チャンピオン対策ノートタブ**: チャンピオン選択と別Spec実装予定のメッセージを表示する

### テスト実行

```bash
npm test -- TabContentPlaceholder.test.tsx --watchAll=false
```

## スタイリング

### Tailwindクラス

- `flex items-center justify-center`: 中央配置
- `h-full p-8`: 高さとパディング
- `text-center text-gray-500`: テキストスタイル
- `text-lg mb-2`: タイトルスタイル
- `text-sm`: 説明文スタイル

## 今後の拡張

このコンポーネントは現在プレースホルダーのみを表示していますが、将来的には以下の機能が追加される予定です：

1. **新規ノート作成タブ**: チャンピオン選択後のノート作成フォーム表示
2. **汎用ノートタブ**: 汎用ノートのCRUD操作UI
3. **チャンピオン対策ノートタブ**: 既存ノートの一覧表示と編集機能

これらの機能は別Specで実装される予定です。

## 関連ファイル

- `TabContentPlaceholder.tsx`: コンポーネント本体
- `TabContentPlaceholder.test.tsx`: ユニットテスト
- `TabContentPlaceholder.example.tsx`: 使用例
- `TabNavigation.tsx`: タブナビゲーションコンポーネント
- `ChampionSelectorSidebar.tsx`: チャンピオン選択サイドバー

## 実装日

2025年1月（Tasks 4.1-4.4）

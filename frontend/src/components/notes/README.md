# Notes Components

このディレクトリには、チャンピオンノート管理機能のUIコンポーネントが含まれています。

## ChampionSelector

チャンピオンを視覚的に選択するためのUIコンポーネントです。

### 機能

- **全チャンピオン表示**: 171チャンピオンの画像をグリッドレイアウトで表示
- **検索機能**: チャンピオン名で検索（部分一致、大文字小文字区別なし）
- **選択状態管理**: 選択されたチャンピオンを視覚的に表示（ピンク色のボーダー）
- **レスポンシブデザイン**: 画面サイズに応じてグリッド列数を調整（4列→6列→8列）
- **パフォーマンス最適化**:
  - React.memoでコンポーネントをメモ化
  - useMemoでフィルタリング結果をメモ化
  - 画像の遅延読み込み（loading="lazy"）

### 使用例

```tsx
import ChampionSelector from '@/components/notes/ChampionSelector';

function MyComponent() {
  const [championId, setChampionId] = useState<string | null>(null);

  return (
    <ChampionSelector
      value={championId}
      onChange={setChampionId}
      label="マイチャンピオン"
    />
  );
}
```

### Props

| Prop     | Type                         | Required | Description                      |
| -------- | ---------------------------- | -------- | -------------------------------- |
| value    | string \| null               | Yes      | 選択されているチャンピオンID     |
| onChange | (championId: string) => void | Yes      | チャンピオン選択時のコールバック |
| label    | string                       | Yes      | セレクターのラベル               |

### テスト

単体テストは `__tests__/ChampionSelector.test.tsx` に実装されています。

テストを実行するには、まず以下の依存関係をインストールしてください：

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom
```

その後、`package.json` にテストスクリプトを追加：

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

### 動作確認

開発中の動作確認には、テストページを使用できます：

```
http://localhost:3000/test-champion-selector
```

このページでは以下を確認できます：

- チャンピオン選択の動作
- 検索機能
- 選択状態の視覚的表示
- レスポンシブデザイン

## NoteCard

ノート一覧で個別のノートを表示するカードコンポーネントです。

### 機能

- **チャンピオン画像表示**: マイチャンピオンと敵チャンピオン（対策ノートの場合）の画像を表示
- **ノートタイプバッジ**: 汎用ノート（青色）と対策ノート（緑色）を識別
- **メモプレビュー**: 最初の100文字を表示、超える場合は「...」を追加
- **作成日時表示**: 日本語形式で更新日時を表示（例: 2024年1月15日）
- **編集・削除ボタン**: ノートの編集・削除アクションを実行
- **パフォーマンス最適化**: React.memoでメモ化

### 使用例

```tsx
import NoteCard from '@/components/notes/NoteCard';

function NotesPage() {
  const handleEdit = (id: number) => {
    router.push(`/notes/edit/${id}`);
  };

  const handleDelete = async (id: number) => {
    if (confirm('本当に削除しますか？')) {
      await deleteNote(id);
      // ノート一覧を再読み込み
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}
```

### Props

| Prop     | Type                 | Required | Description                        |
| -------- | -------------------- | -------- | ---------------------------------- |
| note     | ChampionNote         | Yes      | 表示するノートデータ               |
| onDelete | (id: number) => void | Yes      | 削除ボタンクリック時のコールバック |
| onEdit   | (id: number) => void | Yes      | 編集ボタンクリック時のコールバック |

### 表示内容

- **ノートタイプバッジ**:
  - 汎用ノート: 青色バッジ（`bg-blue-600`）
  - 対策ノート: 緑色バッジ（`bg-green-600`）
- **チャンピオン画像**:
  - マイチャンピオン: 常に表示（48x48px）
  - 敵チャンピオン: 対策ノートの場合のみ表示（48x48px）
  - 画像パス: `/images/champion/{ChampionName}.png`
- **メモプレビュー**:
  - 100文字以内: そのまま表示
  - 100文字超: 最初の100文字 + "..."
- **作成日時**:
  - 日本語形式: `2024年1月15日`
  - `updated_at`フィールドを使用
- **ボタン**:
  - 編集ボタン: 青色（`bg-blue-600`）
  - 削除ボタン: 赤色（`bg-red-600`）

### テスト

単体テストは `__tests__/NoteCard.test.tsx` に実装されています。

テストカバレッジ:

- 基本表示（バッジ、画像、メモ、日時、ボタン）
- メモプレビューの切り捨て（100文字制限）
- ボタンクリック機能（編集・削除）
- アクセシビリティ（aria-label、alt属性）
- スタイリング（Tailwindクラス）

### 使用例ファイル

`NoteCard.example.tsx` に実装例があります。

## 実装済みタスク

- [x] 3.1 基本的なチャンピオン選択UIを実装
- [x] 3.2 チャンピオン検索機能を実装
- [x] 3.3 選択状態管理を実装
- [x] 3.4 パフォーマンス最適化を実装
- [x] 3.5 ChampionSelectorの単体テストを作成（オプション）
- [x] 4. NoteCardコンポーネントの実装
- [x] 4.1 NoteCardの単体テストを作成（オプション）

## 技術仕様

### スタイリング

- Tailwind CSSを使用
- 選択状態: `border-pink-500 ring-2 ring-pink-500`
- ホバー状態: `hover:border-pink-300 hover:scale-105`
- グリッドレイアウト: `grid-cols-4 md:grid-cols-6 lg:grid-cols-8`

### アクセシビリティ

- 各ボタンに `aria-label` 属性を設定
- 画像に適切な `alt` 属性を設定
- キーボード操作対応（ボタン要素を使用）

### パフォーマンス

- React.memo: 不要な再レンダリングを防止
- useMemo: フィルタリング結果をメモ化
- loading="lazy": 画像の遅延読み込み
- width/height属性: レイアウトシフト防止

## 依存関係

- `@/lib/data/champions`: チャンピオンデータ
- `@/types/note`: Champion型定義

## 今後の拡張予定

- ロール別フィルタリング
- お気に入りチャンピオン機能
- 最近使用したチャンピオンの表示

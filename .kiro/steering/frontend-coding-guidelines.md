---
inclusion: fileMatch
fileMatchPattern: 'frontend/**/*'
---

# フロントエンドコーディング規約

## 概要

このドキュメントはフロントエンド（Next.js/React/TypeScript）開発における技術的なコーディング規約とベストプラクティスを定義します。

## 技術スタック

- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript
- **UIライブラリ**: React 19
- **スタイリング**: Tailwind CSS
- **状態管理**: React Hooks (useState, useEffect, etc.)
- **データフェッチング**: fetch API

## 画像の扱い

### Next.js Image コンポーネント

**原則**: 静的画像には `next/image` の `<Image>` コンポーネントを使用する

```tsx
import Image from 'next/image';

<Image
  src="/images/champion/Ahri.png"
  alt="Ahri"
  width={48}
  height={48}
/>
```

**メリット**:
- 自動最適化
- 遅延読み込み
- レスポンシブ対応
- WebP自動変換

### GIFアニメーションの扱い

**重要**: GIFアニメーションには通常の `<img>` タグを使用する

```tsx
{/* eslint-disable-next-line @next/next/no-img-element */}
<img
  src="/loading/nunu.gif"
  alt="Loading"
  width={240}
  height={240}
/>
```

**理由**:
- Next.jsの画像最適化はGIFアニメーションに対応していない
- `<Image>` を使うと400エラーが発生する
- ESLintの警告を抑制するコメントを必ず追加する

### 画像パス

- **public配下**: `/images/champion/`, `/images/item/`, `/images/runes/`
- **絶対パス**: `/` から始まる（例: `/images/champion/Ahri.png`）
- **相対パス**: 使用しない

## コンポーネント設計

### ファイル構成

```
frontend/src/
├── app/              # App Router ページ
├── components/       # 再利用可能なコンポーネント
├── types/           # TypeScript型定義
└── utils/           # ユーティリティ関数
```

### コンポーネント命名

- **ファイル名**: PascalCase（例: `GlobalLoading.tsx`）
- **コンポーネント名**: ファイル名と一致させる
- **Props型**: `ComponentNameProps` または inline定義

```tsx
// Good
export default function GlobalLoading({ loading }: { loading: boolean }) {
  // ...
}

// Also Good
interface GlobalLoadingProps {
  loading: boolean;
}

export default function GlobalLoading({ loading }: GlobalLoadingProps) {
  // ...
}
```

### Server Components vs Client Components

**デフォルト**: Server Components（'use client' なし）

**Client Componentsを使う場合**:
- インタラクティブな要素（onClick, onChange等）
- React Hooks（useState, useEffect等）
- ブラウザAPI（localStorage, window等）

```tsx
'use client';

import { useState } from 'react';

export default function InteractiveComponent() {
  const [count, setCount] = useState(0);
  // ...
}
```

## TypeScript規約

### 型定義

- **明示的な型注釈**: 関数の引数と戻り値には型を明示する
- **any禁止**: `any` は使用しない（やむを得ない場合は `unknown` を使用）
- **型推論活用**: 変数宣言では型推論を活用する

```tsx
// Good
function fetchChampionData(championId: string): Promise<Champion> {
  // ...
}

// Bad
function fetchChampionData(championId) {
  // ...
}
```

### インターフェース vs Type

- **Props定義**: どちらでも可（プロジェクト内で統一）
- **API型定義**: `interface` を優先
- **Union/Intersection**: `type` を使用

```tsx
// Props - どちらでも可
interface ButtonProps {
  label: string;
  onClick: () => void;
}

type ButtonProps = {
  label: string;
  onClick: () => void;
};

// Union - type を使用
type Status = 'loading' | 'success' | 'error';
```

## スタイリング規約

### Tailwind CSS

**原則**: インラインでTailwindクラスを使用する

```tsx
<div className="flex items-center justify-center p-4 bg-gray-100">
  <h1 className="text-2xl font-bold text-gray-900">Title</h1>
</div>
```

### 条件付きスタイル

```tsx
// Good - テンプレートリテラル
<div className={`base-class ${isActive ? 'active-class' : 'inactive-class'}`}>

// Better - clsx/classnames使用（導入済みの場合）
import clsx from 'clsx';
<div className={clsx('base-class', {
  'active-class': isActive,
  'inactive-class': !isActive,
})}>
```

## データフェッチング

### Server Components

```tsx
// app/page.tsx
async function getData() {
  const res = await fetch('http://localhost:8000/api/endpoint', {
    cache: 'no-store', // または 'force-cache', next: { revalidate: 3600 }
  });
  return res.json();
}

export default async function Page() {
  const data = await getData();
  return <div>{/* render data */}</div>;
}
```

### Client Components

```tsx
'use client';

import { useState, useEffect } from 'react';

export default function ClientComponent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/endpoint')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  return <div>{/* render data */}</div>;
}
```

## エラーハンドリング

### try-catch

```tsx
async function fetchData() {
  try {
    const res = await fetch('/api/endpoint');
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch data:', error);
    throw error;
  }
}
```

### Error Boundary（Next.js）

```tsx
// app/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

## パフォーマンス最適化

### 動的インポート

```tsx
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>,
  ssr: false, // クライアントサイドのみ
});
```

### メモ化

```tsx
import { useMemo, useCallback } from 'react';

// 計算コストの高い処理
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// コールバック関数
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
```

## アクセシビリティ

### 必須属性

- **画像**: `alt` 属性を必ず指定
- **ボタン**: 意味のあるテキストまたは `aria-label`
- **フォーム**: `label` と `input` を関連付ける

```tsx
// Good
<img src="/image.png" alt="Champion Ahri" />
<button aria-label="Close modal">×</button>
<label htmlFor="username">Username</label>
<input id="username" type="text" />
```

### セマンティックHTML

```tsx
// Good
<nav>
  <ul>
    <li><a href="/">Home</a></li>
  </ul>
</nav>

// Bad
<div>
  <div>
    <div><a href="/">Home</a></div>
  </div>
</div>
```

## 命名規則

### 変数・関数

- **boolean**: `is`, `has`, `should` で始める（例: `isLoading`, `hasError`）
- **関数**: 動詞で始める（例: `fetchData`, `handleClick`, `calculateTotal`）
- **定数**: UPPER_SNAKE_CASE（例: `API_BASE_URL`, `MAX_RETRY_COUNT`）

### イベントハンドラ

```tsx
// Good
const handleClick = () => { /* ... */ };
const handleSubmit = () => { /* ... */ };
const handleChange = () => { /* ... */ };

// Bad
const click = () => { /* ... */ };
const submit = () => { /* ... */ };
```

## コメント

### JSDoc

```tsx
/**
 * ユーザー情報を取得する
 * @param userId - ユーザーID
 * @returns ユーザー情報
 */
async function fetchUser(userId: string): Promise<User> {
  // ...
}
```

### インラインコメント

- **複雑なロジック**: 必ず説明を追加
- **一時的な回避策**: `// TODO:` または `// FIXME:` を使用
- **ESLint抑制**: 理由を明記

```tsx
// GIFアニメーションはNext.js Imageで最適化できないため通常のimgタグを使用
{/* eslint-disable-next-line @next/next/no-img-element */}
<img src="/loading.gif" alt="Loading" />
```

## 環境変数

### 命名規則

- **公開変数**: `NEXT_PUBLIC_` プレフィックス必須
- **サーバー専用**: プレフィックスなし

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
DATABASE_URL=postgresql://...
```

### 使用方法

```tsx
// クライアント・サーバー両方で使用可能
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// サーバーコンポーネント/APIルートのみ
const dbUrl = process.env.DATABASE_URL;
```

## テスト（今後追加予定）

- **ユニットテスト**: Jest + React Testing Library
- **E2Eテスト**: Playwright
- **カバレッジ**: 80%以上を目標

## 参照ドキュメント

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

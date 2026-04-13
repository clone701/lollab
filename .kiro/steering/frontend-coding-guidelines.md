---
inclusion: fileMatch
fileMatchPattern: 'frontend/**/*'
---

# フロントエンドコーディング規約

## プロジェクト固有ルール

### 画像の扱い

#### 静的画像: Next.js Image
```tsx
import Image from 'next/image';

<Image
  src="/images/champion/Ahri.png"
  alt="Ahri"
  width={48}
  height={48}
/>
```

#### GIFアニメーション: 通常のimgタグ
```tsx
{/* GIFはNext.js Imageで最適化できないため通常のimgタグを使用 */}
{/* eslint-disable-next-line @next/next/no-img-element */}
<img
  src="/images/loading/nunu.gif"
  alt="Loading"
  width={240}
  height={240}
/>
```

**画像パス**: `/images/champion/`, `/images/item/`, `/images/runes/`, `/images/loading/`

### 認証（Supabase Auth）

```tsx
// 認証状態の取得
'use client';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function Component() {
  const { user, session, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!session) return <div>Not authenticated</div>;
  
  return <div>Welcome {user?.email}</div>;
}
```

**ログイン・ログアウト**:
```tsx
'use client';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function AuthButton() {
  const { user, signInWithGoogle, signOut } = useAuth();
  
  if (user) {
    return <button onClick={signOut}>ログアウト</button>;
  }
  
  return <button onClick={signInWithGoogle}>ログイン</button>;
}
```

### Server Components vs Client Components

**デフォルト**: Server Components（'use client' なし）

**Client Componentsを使う場合**:
- インタラクティブな要素（onClick, onChange等）
- React Hooks（useState, useEffect等）
- ブラウザAPI（localStorage, window等）
- Supabase Auth（useAuth等）

```tsx
'use client';

import { useState } from 'react';

export default function InteractiveComponent() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

### データフェッチング

#### Server Components
```tsx
async function getData() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/endpoint`, {
    cache: 'no-store', // または next: { revalidate: 3600 }
  });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

export default async function Page() {
  const data = await getData();
  return <div>{/* render */}</div>;
}
```

#### Client Components
```tsx
'use client';

import { useState, useEffect } from 'react';

export default function ClientComponent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/endpoint`)
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(error => console.error('Failed to fetch:', error));
  }, []);

  if (loading) return <div>Loading...</div>;
  return <div>{/* render */}</div>;
}
```

### Tailwind CSS

**原則**: インラインでTailwindクラスを使用

```tsx
<div className="flex items-center justify-center p-4 bg-gray-100">
  <h1 className="text-2xl font-bold text-gray-900">Title</h1>
</div>
```

**条件付きスタイル**:
```tsx
<div className={`base-class ${isActive ? 'active' : 'inactive'}`}>
```

### パフォーマンス最適化

#### 動的インポート
```tsx
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>,
  ssr: false,
});
```

#### メモ化
```tsx
import { useMemo, useCallback } from 'react';

const expensiveValue = useMemo(() => computeExpensive(data), [data]);
const handleClick = useCallback(() => doSomething(id), [id]);
```

### アクセシビリティ

```tsx
// 画像: alt属性必須
<img src="/image.png" alt="Champion Ahri" />

// ボタン: 意味のあるテキストまたはaria-label
<button aria-label="Close modal">×</button>

// フォーム: labelとinputを関連付け
<label htmlFor="username">Username</label>
<input id="username" type="text" />
```

### 環境変数

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000
```

**使用**:
```tsx
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
```

### パス解決

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**使用例**:
```tsx
import { Button } from '@/components/ui/Button';
import { useSummoner } from '@/lib/hooks/useSummoner';
```

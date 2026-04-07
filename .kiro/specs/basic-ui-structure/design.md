# 技術設計書: 基本UI構造

## 概要

このドキュメントは、LoL Labアプリケーションの基本UI構造の技術設計を定義します。この機能は、アプリケーション全体で使用される基盤となるレイアウト、共通コンポーネント、状態管理を確立します。

## アーキテクチャ

### システム構成

```
frontend/src/
├── app/
│   ├── layout.tsx              # ルートレイアウト（Navbar, Footer含む）
│   ├── page.tsx                # ホームページ
│   ├── globals.css             # グローバルスタイル
│   ├── providers.tsx           # 既存（変更不要）
│   └── api/auth/[...nextauth]/ # 既存（変更不要）
├── components/
│   ├── Navbar.tsx              # ナビゲーションバー
│   ├── Footer.tsx              # フッター
│   └── GlobalLoading.tsx       # グローバルローディング
└── lib/
    └── contexts/
        └── LoadingContext.tsx  # ローディング状態管理
```

### 技術スタック

- **Next.js 15**: App Router、Server Components、Client Components
- **React 19**: UIコンポーネント
- **TypeScript 5**: 型安全性
- **Tailwind CSS 4**: スタイリング
- **NextAuth.js 4**: 認証（既存設定を使用）

### レイアウト階層

```
RootLayout (layout.tsx)
├── Providers (既存)
│   ├── SessionProvider (NextAuth)
│   └── LoadingContext.Provider
├── Navbar
├── main (コンテンツエリア)
│   └── {children}
├── Footer
└── GlobalLoading
```

## コンポーネントと責務

### 1. RootLayout (`app/layout.tsx`)

**責務**:
- アプリケーション全体の基本構造を提供
- メタデータ設定
- グローバルスタイル適用
- Providersでラップ

**実装詳細**:

```typescript
import type { Metadata } from 'next';
import { Providers } from './providers';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import './globals.css';

export const metadata: Metadata = {
  title: 'LoL Lab',
  description: 'League of Legends戦略分析ツール',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <Providers>
          <Navbar />
          <main className="mx-auto max-w-6xl px-4">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
```

**レイアウト仕様**:
- 言語: `lang="ja"`
- 最大幅: `max-w-6xl` (1152px)
- 水平中央揃え: `mx-auto`
- 左右パディング: `px-4` (16px)

### 2. Navbar (`components/Navbar.tsx`)

**責務**:
- アプリケーションロゴ表示
- ナビゲーションリンク提供
- 認証状態表示
- ログイン/ログアウト機能

**実装詳細**:

```typescript
'use client';

import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useContext } from 'react';
import { LoadingContext } from '@/lib/contexts/LoadingContext';

export default function Navbar() {
  const { data: session, status } = useSession();
  const { setLoading } = useContext(LoadingContext);

  const handleSignIn = () => {
    setLoading(true);
    signIn('google');
  };

  const handleSignOut = () => {
    setLoading(true);
    signOut();
  };

  return (
    <header className="bg-white border-b border-[var(--border)] text-[var(--foreground)] sticky top-0 z-40">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <Link href="/" className="text-lg font-bold tracking-tight">
            LoL Lab
          </Link>
          <span className="ml-1 bg-gray-100 text-gray-500 text-xs rounded px-2 py-0.5 border border-gray-200">
            ベータ
          </span>
        </div>

        {/* Center: Navigation */}
        <nav className="hidden gap-8 md:flex">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-[var(--foreground)] transition"
          >
            ホーム
          </Link>
        </nav>

        {/* Right: User Menu */}
        <div className="flex items-center gap-2">
          {status === 'loading' ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
          ) : session ? (
            <>
              {session.user?.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  className="h-8 w-8 rounded-full"
                />
              )}
              <button
                onClick={handleSignOut}
                className="bg-gray-700 text-white px-4 py-1.5 rounded font-medium text-sm hover:bg-gray-900 transition"
              >
                ログアウト
              </button>
            </>
          ) : (
            <button
              onClick={handleSignIn}
              className="bg-gray-700 text-white px-4 py-1.5 rounded font-medium text-sm hover:bg-gray-900 transition"
            >
              ログイン
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
```

**スタイル仕様**:
- 高さ: `h-14` (56px)
- 位置: `sticky top-0 z-40`
- 背景: 白 + 下ボーダー
- レスポンシブ: モバイルではナビゲーション非表示 (`hidden md:flex`)

**認証状態**:
- `loading`: アニメーションするプレースホルダー
- `authenticated`: ユーザーアバター + ログアウトボタン
- `unauthenticated`: ログインボタン

### 3. Footer (`components/Footer.tsx`)

**責務**:
- 著作権情報表示
- 免責事項表示

**実装詳細**:

```typescript
export default function Footer() {
  return (
    <footer className="border-t mt-16">
      <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-gray-600">
        <p>
          This is an unofficial fan site and is not endorsed by Riot Games.
          <br />
          © Riot Games. League of Legends and all related logos, characters,
          names and distinctive likenesses thereof are exclusive property of
          Riot Games, Inc.
        </p>
      </div>
    </footer>
  );
}
```

**スタイル仕様**:
- 上ボーダー: `border-t`
- 上マージン: `mt-16` (64px)
- パディング: `py-6` (24px)
- テキスト: `text-sm text-gray-600`

### 4. GlobalLoading (`components/GlobalLoading.tsx`)

**責務**:
- 非同期処理中のローディング表示
- 画面右下に固定表示
- GIFアニメーション表示

**実装詳細**:

```typescript
export default function GlobalLoading({ loading }: { loading: boolean }) {
  if (!loading) return null;

  return (
    <div
      style={{
        position: 'fixed',
        right: '24px',
        bottom: '24px',
        zIndex: 9999,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/loading/nunu.gif"
        alt="Loading"
        width={240}
        height={240}
      />
    </div>
  );
}
```

**スタイル仕様**:
- 位置: 右下固定 (`fixed`, `right: 24px`, `bottom: 24px`)
- z-index: `9999` (最前面)
- 画像: `/images/loading/nunu.gif`
- サイズ: `240x240px`

**重要**: GIFアニメーションは通常の`<img>`タグを使用（Next.js `<Image>`は非対応）

### 5. HomePage (`app/page.tsx`)

**責務**:
- ホームページのコンテンツ表示
- 将来的にサモナー検索機能を配置

**実装詳細**:

```typescript
export default function HomePage() {
  return (
    <div className="py-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">
          LoL Lab へようこそ
        </h1>
        <p className="text-gray-600">
          League of Legends戦略分析ツール
        </p>
      </div>
    </div>
  );
}
```

**スタイル仕様**:
- パディング: `py-8` (32px)
- 中央揃え: `text-center`
- 見出し: `text-3xl font-bold`

## データモデル

### LoadingContext

**型定義**:

```typescript
interface LoadingContextType {
  loading: boolean;
  setLoading: (v: boolean) => void;
}
```

**用途**:
- アプリケーション全体でローディング状態を共有
- 任意のコンポーネントからローディング表示を制御

### Session（NextAuth）

**型定義**:

```typescript
interface Session {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  expires: string;
}
```

**用途**:
- ユーザー認証状態の管理
- ユーザー情報の取得

## インターフェース

### LoadingContext (`lib/contexts/LoadingContext.tsx`)

**実装詳細**:

```typescript
'use client';

import { createContext } from 'react';

export const LoadingContext = createContext<{
  loading: boolean;
  setLoading: (v: boolean) => void;
}>({
  loading: false,
  setLoading: () => {},
});
```

**使用方法**:

```typescript
import { useContext } from 'react';
import { LoadingContext } from '@/lib/contexts/LoadingContext';

function MyComponent() {
  const { loading, setLoading } = useContext(LoadingContext);
  
  const handleAction = async () => {
    setLoading(true);
    try {
      await someAsyncOperation();
    } finally {
      setLoading(false);
    }
  };
}
```

### Providers（既存）

**場所**: `app/providers.tsx`

**実装**:

```typescript
'use client';

import { SessionProvider } from 'next-auth/react';
import { LoadingContext } from '@/lib/contexts/LoadingContext';
import { useState } from 'react';
import GlobalLoading from '@/components/GlobalLoading';

export function Providers({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);

  return (
    <SessionProvider>
      <LoadingContext.Provider value={{ loading, setLoading }}>
        {children}
        <GlobalLoading loading={loading} />
      </LoadingContext.Provider>
    </SessionProvider>
  );
}
```

**責務**:
- SessionProviderでラップ（NextAuth）
- LoadingContextProviderでラップ
- GlobalLoadingコンポーネントをレンダリング

**注意**: このファイルは既存のため、変更不要

## グローバルスタイル

### globals.css (`app/globals.css`)

**実装詳細**:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #f5f7fa;
  --foreground: #22223b;
  --card-bg: #fafdff;
  --border: #e3e8ee;
  --button-bg: #fafdff;
  --button-hover: #e9f1fa;
  --button-text: #374151;
}

body {
  color: var(--foreground);
  background: var(--background);
  font-family: 'Geist', 'Segoe UI', 'Meiryo', Arial, Helvetica, sans-serif;
}
```

**カラーパレット**:
- `--background`: `#f5f7fa` - サイト全体の背景
- `--foreground`: `#22223b` - 基本テキスト色
- `--card-bg`: `#fafdff` - カード背景
- `--border`: `#e3e8ee` - 枠線
- `--button-bg`: `#fafdff` - ボタン背景
- `--button-hover`: `#e9f1fa` - ボタンホバー
- `--button-text`: `#374151` - ボタンテキスト

**フォント**:
- プライマリ: `Geist`
- フォールバック: `Segoe UI`, `Meiryo`, `Arial`, `Helvetica`, `sans-serif`

## エラーハンドリング

### 認証エラー

**シナリオ**: Google OAuth認証失敗

**処理**:
```typescript
const handleSignIn = () => {
  setLoading(true);
  signIn('google').catch((error) => {
    console.error('Authentication failed:', error);
    setLoading(false);
  });
};
```

**ユーザー体験**:
- ローディング表示を停止
- NextAuthのデフォルトエラーページに遷移

### セッション読み込みエラー

**シナリオ**: セッション情報の取得失敗

**処理**:
```typescript
const { data: session, status } = useSession();

if (status === 'loading') {
  return <LoadingPlaceholder />;
}

if (status === 'unauthenticated') {
  return <LoginButton />;
}
```

**ユーザー体験**:
- ローディング中: プレースホルダー表示
- 未認証: ログインボタン表示

## テスト戦略

### テストアプローチ

この機能はUIレイアウト、レンダリング、認証統合を中心としているため、Property-Based Testing（PBT）は適用しません。代わりに以下のテスト戦略を採用します。

### 1. 手動テスト

**レイアウト検証**:
- [ ] ナビゲーションバーが全ページの上部に表示される
- [ ] フッターが全ページの下部に表示される
- [ ] メインコンテンツエリアが適切な幅と余白を持つ
- [ ] スクロール時にナビゲーションバーが固定される

**レスポンシブ検証**:
- [ ] モバイル（375px）で適切に表示される
- [ ] タブレット（768px）で適切に表示される
- [ ] デスクトップ（1280px）で適切に表示される
- [ ] ナビゲーションがモバイルで非表示になる

**認証フロー検証**:
- [ ] ログインボタンをクリックするとGoogle OAuth画面に遷移する
- [ ] 認証成功後、ユーザーアバターとログアウトボタンが表示される
- [ ] ログアウトボタンをクリックするとログアウトされる
- [ ] 認証処理中にローディング表示が出る

**ローディング表示検証**:
- [ ] ログイン時にローディングGIFが右下に表示される
- [ ] ログアウト時にローディングGIFが右下に表示される
- [ ] 処理完了後にローディングGIFが非表示になる

### 2. ビジュアルレグレッションテスト（将来）

**ツール**: Playwright + Percy（または類似ツール）

**テストケース**:
- ナビゲーションバー（未認証状態）
- ナビゲーションバー（認証済み状態）
- ナビゲーションバー（ローディング状態）
- フッター
- ホームページ全体

### 3. アクセシビリティテスト（将来）

**ツール**: axe-core, Lighthouse

**検証項目**:
- [ ] HTMLに`lang="ja"`属性が設定されている
- [ ] 画像に適切な`alt`属性が設定されている
- [ ] ボタンがキーボードで操作可能
- [ ] カラーコントラストが基準を満たす
- [ ] セマンティックHTMLが使用されている

### 4. 統合テスト（将来）

**ツール**: Playwright

**テストシナリオ**:
```typescript
test('ユーザーがログインしてログアウトできる', async ({ page }) => {
  await page.goto('/');
  await page.click('text=ログイン');
  // Google OAuth フロー（モック）
  await page.waitForSelector('img[alt*="User"]');
  await page.click('text=ログアウト');
  await page.waitForSelector('text=ログイン');
});
```

### テスト優先度

**P0（必須 - 手動テスト）**:
- レイアウト構造の検証
- 認証フローの検証
- レスポンシブデザインの検証

**P1（重要 - 将来実装）**:
- ビジュアルレグレッションテスト
- アクセシビリティテスト

**P2（あると良い - 将来実装）**:
- 統合テスト（E2E）
- パフォーマンステスト

## パフォーマンス考慮事項

### Server Components vs Client Components

**Server Components**:
- `layout.tsx`: メタデータ、静的構造
- `page.tsx`: 静的コンテンツ
- `Footer.tsx`: 静的コンテンツ

**Client Components**:
- `Navbar.tsx`: 認証状態、インタラクション
- `GlobalLoading.tsx`: 動的表示制御
- `providers.tsx`: React Context

**理由**:
- Server Componentsでバンドルサイズを削減
- Client Componentsは必要最小限に限定

### 画像最適化

**GIFアニメーション**:
- 通常の`<img>`タグを使用
- Next.js `<Image>`は使用不可（GIF非対応）

**静的画像（将来）**:
- Next.js `<Image>`を使用
- 自動最適化、遅延読み込み

### CSS最適化

**Tailwind CSS**:
- 未使用クラスの自動削除
- プロダクションビルドで最小化

**CSS変数**:
- カラーパレットをCSS変数で管理
- 一貫性とメンテナンス性向上

## セキュリティ考慮事項

### 認証

**NextAuth.js**:
- Google OAuth 2.0による安全な認証
- JWTトークンベースのセッション管理
- HTTPS通信必須

**環境変数**:
```bash
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### XSS対策

**React**:
- デフォルトでXSS対策済み
- `dangerouslySetInnerHTML`は使用しない

**画像**:
- ユーザーアバターは外部URL（Google）
- `alt`属性でフォールバック

### CSRF対策

**NextAuth.js**:
- CSRFトークン自動管理
- セッションCookie設定

## デプロイメント考慮事項

### 環境変数

**開発環境** (`.env.local`):
```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=development-secret
GOOGLE_CLIENT_ID=your-dev-client-id
GOOGLE_CLIENT_SECRET=your-dev-client-secret
```

**本番環境** (Render):
```bash
NEXTAUTH_URL=https://lollab.onrender.com
NEXTAUTH_SECRET=production-secret
GOOGLE_CLIENT_ID=your-prod-client-id
GOOGLE_CLIENT_SECRET=your-prod-client-secret
```

### ビルド設定

**Next.js設定** (`next.config.ts`):
```typescript
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['lh3.googleusercontent.com'], // Google アバター
  },
};

export default nextConfig;
```

### 静的アセット

**画像配置**:
- `/public/images/loading/nunu.gif`: ローディングGIF
- 将来: `/public/images/champion/`, `/public/images/item/`

## 今後の拡張予定

### 短期（1-3ヶ月）

**ナビゲーション強化**:
- ノート管理ページへのリンク追加
- アクティブページのハイライト

**ローディング改善**:
- スケルトンスクリーン導入
- プログレスバー追加

### 中期（3-6ヶ月）

**レスポンシブ強化**:
- モバイルメニュー（ハンバーガーメニュー）
- タブレット最適化

**アクセシビリティ**:
- キーボードナビゲーション強化
- スクリーンリーダー対応

### 長期（6ヶ月以降）

**テーマ機能**:
- ダークモード対応
- カスタムテーマ

**パフォーマンス**:
- 画像遅延読み込み
- コード分割最適化

## 参照ドキュメント

- `requirements.md`: 要件定義書
- `reference/frontend/ui-patterns.md`: UIパターン定義
- `reference/frontend/providers.tsx`: Providers実装例
- `.kiro/steering/frontend-coding-guidelines.md`: フロントエンド規約
- `.kiro/steering/structure.md`: リポジトリ構造
- `.kiro/steering/tech.md`: 技術スタック

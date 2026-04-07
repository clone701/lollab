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
- メタデータ設定（title, description）
- グローバルスタイル適用
- Providersでラップ

**構成**:
- HTML言語属性: `ja`
- メインコンテンツ最大幅: 1152px
- 水平中央揃え、左右パディング: 16px

### 2. Navbar (`components/Navbar.tsx`)

**責務**:
- アプリケーションロゴとベータバッジ表示
- ナビゲーションリンク提供
- 認証状態表示
- ログイン/ログアウト機能

**レイアウト**:
- 高さ: 56px
- 位置: 上部固定（sticky）
- 背景: 白 + 下ボーダー
- レスポンシブ: モバイルではナビゲーションリンク非表示

**ロゴとベータバッジ**:
- ロゴ「LoL Lab」:
  - フォントサイズ: `text-2xl`（24px）
  - フォントウェイト: `font-bold`（700）
  - テキストカラー: `text-gray-900`（黒系）
  - レタースペーシング: `tracking-tight`
- ベータバッジ:
  - 背景: `bg-gray-100`（グレー系）
  - テキスト: `text-gray-600`
  - フォントサイズ: `text-xs`
  - パディング: `px-2.5 py-1`
  - 角丸: `rounded-full`
  - フォントウェイト: `font-semibold`（600）

**認証状態UI**:
- `loading`: アニメーションするプレースホルダー（円形、36px）
- `authenticated`: 
  - Googleアカウントのアバター画像を表示（円形、36px）
  - クリックでドロップダウンメニュー表示
  - メニュー内容: ユーザー名、メールアドレス、ログアウトボタン
- `unauthenticated`: ログインボタン
  - 背景: `bg-gray-800`（濃いグレー）
  - テキスト: 白色、フォントウェイト: 600
  - パディング: `px-6 py-2.5`
  - 角丸: `rounded-lg`
  - ホバー効果: `hover:bg-gray-900`
  - トランジション: `transition-all duration-200`

**ドロップダウンメニュー**:
- 位置: アバター下部、右寄せ
- 幅: 240px
- 背景: 白、影付き、角丸
- 内容:
  - ユーザー名（太字、16px）
  - メールアドレス（小サイズ、グレー、12px）
  - 区切り線（グレー）
  - ログアウトボタン（赤色テキスト、ホバーで背景色変更）
- 外側クリックで閉じる
- Escキーで閉じる

**インタラクション**:
- ログイン/ログアウト時にグローバルローディングを表示
- ドロップダウンメニューの開閉アニメーション（フェードイン/アウト）

### 3. Footer (`components/Footer.tsx`)

**責務**:
- 著作権情報表示
- 免責事項表示

**レイアウト**:
- 上ボーダー、上マージン: 64px
- パディング: 24px
- テキスト: 小サイズ、グレー

### 4. GlobalLoading (`components/GlobalLoading.tsx`)

**責務**:
- 非同期処理中のローディング表示
- 画面右下に固定表示
- GIFアニメーション表示

**レイアウト**:
- 位置: 右下固定（right: 24px, bottom: 24px）
- z-index: 9999（最前面）
- 画像: `/images/loading/nunu.gif`（240x240px）

**注意**: GIFアニメーションは通常の`<img>`タグを使用（Next.js `<Image>`は非対応）

### 5. HomePage (`app/page.tsx`)

**責務**:
- ホームページのコンテンツ表示
- 将来的にサモナー検索機能を配置

**レイアウト**:
- パディング: 32px（上下）
- 中央揃え
- 見出し: 大サイズ、太字

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

**使用パターン**:
```typescript
const { loading, setLoading } = useContext(LoadingContext);

// 非同期処理の前後でローディング状態を制御
setLoading(true);
await someAsyncOperation();
setLoading(false);
```

### Providers（既存）

**場所**: `app/providers.tsx`

**責務**:
- SessionProviderでラップ（NextAuth）
- LoadingContextProviderでラップ
- GlobalLoadingコンポーネントをレンダリング

**注意**: このファイルは既存のため、変更不要

## グローバルスタイル

### globals.css (`app/globals.css`)

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
- ローディング表示を停止
- NextAuthのデフォルトエラーページに遷移

### セッション読み込みエラー

**シナリオ**: セッション情報の取得失敗

**処理**:
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
- [ ] 認証成功後、Googleアカウントのアバターが表示される
- [ ] アバターをクリックするとドロップダウンメニューが表示される
- [ ] メニューにユーザー名、メールアドレス、ログアウトボタンが表示される
- [ ] ログアウトボタンをクリックするとログアウトされる
- [ ] メニュー外側をクリックするとメニューが閉じる
- [ ] Escキーを押すとメニューが閉じる
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
- ナビゲーションバー（ドロップダウンメニュー表示状態）
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

**テストシナリオ例**:
- ユーザーがログインしてログアウトできる
- ナビゲーションリンクが正しく動作する
- ローディング表示が適切に表示/非表示される

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
- React Strict Mode有効化
- 外部画像ドメイン許可: `lh3.googleusercontent.com`（Googleアバター用）

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

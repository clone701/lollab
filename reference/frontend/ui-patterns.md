# UIパターン定義

## 概要

このドキュメントはLoL Labアプリケーション全体で使用するUIパターン、デザインシステム、コンポーネント設計の標準を定義します。すべての新規実装はこのパターンに従うことで、一貫性のあるユーザー体験を提供します。

## デザインシステム

### カラーパレット

#### CSS変数定義
```css
:root {
  --background: #f5f7fa;      /* 青みがかったやさしいグレー（サイト全体の背景） */
  --foreground: #22223b;      /* やや柔らかい濃いグレー（基本テキスト色） */
  --card-bg: #fafdff;         /* 白すぎない淡いブルーグレー（カード背景） */
  --border: #e3e8ee;          /* ほんのり青みの淡いグレー（枠線） */
  --button-bg: #fafdff;       /* カードと同じやさしい色（ボタン背景） */
  --button-hover: #e9f1fa;    /* さらに淡いブルーグレー（ボタンホバー） */
  --button-text: #374151;     /* gray-700: ボタンのテキスト色 */
}
```

#### 用途別カラー
- **背景色**: `var(--background)` - サイト全体の背景
- **テキスト色**: `var(--foreground)` - 基本テキスト
- **カード背景**: `var(--card-bg)` - パネル、カード、検索ボックス
- **枠線**: `var(--border)` - ボーダー、区切り線
- **アクセントカラー**: ピンク系（選択状態、アクティブ状態）
  - `bg-pink-100`, `border-pink-200`, `text-pink-700`
  - `ring-pink-50` (フォーカスリング)

#### グレースケール（Tailwind）
- `text-gray-500`: セカンダリテキスト
- `text-gray-600`: 補助テキスト
- `text-gray-700`: ボタンテキスト
- `text-gray-800`: 強調テキスト
- `text-gray-900`: 見出し、重要テキスト
- `border-gray-200`: 通常の枠線
- `border-gray-300`: 強調枠線
- `bg-gray-50`: ホバー背景（淡い）
- `bg-gray-100`: ホバー背景（やや濃い）
- `bg-gray-700`: プライマリボタン背景
- `bg-gray-900`: プライマリボタンホバー

### タイポグラフィ

#### フォントファミリー
```css
font-family: 'Geist', 'Segoe UI', 'Meiryo', Arial, Helvetica, sans-serif;
```

#### テキストサイズ
- **見出し（大）**: `text-lg font-medium` (18px, 500)
- **見出し（中）**: `text-base font-medium` (16px, 500)
- **見出し（小）**: `text-sm font-medium` (14px, 500)
- **本文**: `text-[15px]` または `text-sm` (14-15px)
- **補助テキスト**: `text-xs` (12px)
- **極小テキスト**: `text-[11px]` (11px)

#### フォントウェイト
- **通常**: `font-normal` (400)
- **中**: `font-medium` (500)
- **太字**: `font-bold` (700)

### スペーシング

#### 標準スペーシング
- **極小**: `gap-2` (8px) - アイコンとテキスト間
- **小**: `gap-3` (12px) - チップ、ボタン間
- **中**: `gap-4` (16px) - セクション内要素間
- **大**: `gap-6` (24px) - セクション間
- **極大**: `gap-8` (32px) - メジャーセクション間

#### パディング
- **コンパクト**: `p-2` (8px)
- **通常**: `p-3` または `p-4` (12-16px)
- **ゆったり**: `p-6` (24px)

#### マージン
- **セクション間**: `mb-3` (12px), `mb-4` (16px)
- **大きなセクション間**: `mb-6` (24px), `mb-10` (40px)

### 角丸（Border Radius）

- **小**: `rounded` (4px) - 小さなボタン、バッジ
- **中**: `rounded-lg` (8px) - カード、パネル、ボタン
- **大**: `rounded-xl` (12px) - 大きなカード
- **円形**: `rounded-full` - アバター、アイコンボタン

## レイアウトパターン

### ページレイアウト

#### 基本構造
```tsx
<html lang="ja">
  <body>
    <Navbar />
    <main className="mx-auto max-w-6xl px-4">
      {children}
    </main>
    <Footer />
  </body>
</html>
```

**ルール**:
- 最大幅: `max-w-6xl` (1152px)
- 水平中央揃え: `mx-auto`
- 左右パディング: `px-4` (16px)

#### グリッドレイアウト
```tsx
{/* 2カラム: メインコンテンツ + サイドバー */}
<section className="grid gap-8 md:grid-cols-[1fr,320px]">
  <div className="space-y-8">{/* メインコンテンツ */}</div>
  <div>{/* サイドバー（320px固定） */}</div>
</section>

{/* 3カラム: フォーム */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <div className="col-span-3 md:col-span-2">{/* メイン */}</div>
  <div>{/* サイド */}</div>
</div>
```

### ナビゲーションバー

#### 構造
```tsx
<header className="bg-white border-b border-[var(--border)] text-[var(--foreground)] sticky top-0 z-40">
  <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
    {/* Left: Logo */}
    <div className="flex items-center gap-2">
      <Link href="/" className="text-lg font-bold tracking-tight">LoL Lab</Link>
      <span className="ml-1 bg-gray-100 text-gray-500 text-xs rounded px-2 py-0.5 border border-gray-200">
        ベータ
      </span>
    </div>
    
    {/* Center: Navigation */}
    <nav className="hidden gap-8 md:flex">
      <Link href="/" className="text-sm text-gray-500 hover:text-[var(--foreground)] transition">
        ホーム
      </Link>
    </nav>
    
    {/* Right: User Menu */}
    <div className="flex items-center gap-2">{/* 認証ボタン/アバター */}</div>
  </div>
</header>
```

**特徴**:
- 高さ: `h-14` (56px)
- スティッキー: `sticky top-0 z-40`
- 背景: 白 + 下ボーダー
- レスポンシブ: モバイルではナビゲーション非表示

### フッター

```tsx
<footer className="border-t">
  <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-gray-600">
    <p>
      This is an unofficial fan site and is not endorsed by Riot Games.
      <br />© Riot Games.
    </p>
  </div>
</footer>
```

## コンポーネントパターン

### Panel（汎用パネル）

#### 基本実装
```tsx
export function Panel({ children, className = '' }: Props) {
  return (
    <div className={`p-4 border border-transparent rounded bg-white ${className}`.trim()}>
      {children}
    </div>
  );
}
```

**用途**:
- カード、セクションを囲む汎用コンテナ
- 背景: 白
- パディング: `p-4` (16px)
- 角丸: `rounded` (4px)
- ボーダー: 透明（必要に応じて上書き可能）

**使用例**:
```tsx
<Panel>
  <div className="mb-3">
    <div className="text-sm font-medium">サモナースペル</div>
  </div>
  {/* コンテンツ */}
</Panel>
```

### ボタンパターン

#### プライマリボタン
```tsx
<button className="bg-gray-700 text-white px-4 py-1.5 rounded font-medium text-sm hover:bg-gray-900 transition">
  ログイン
</button>
```

**特徴**:
- 背景: `bg-gray-700`
- ホバー: `bg-gray-900`
- テキスト: 白、`font-medium`
- パディング: `px-4 py-1.5`
- トランジション: `transition`

#### セカンダリボタン（検索ボタン）
```tsx
<button className="h-11 rounded-lg bg-gray-700 px-4 text-white hover:bg-gray-800">
  検索
</button>
```

#### チップボタン（最近検索、ピン留め）
```tsx
<button className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-gray-800 hover:bg-gray-100 transition">
  {text}
</button>
```

**特徴**:
- 背景: 白
- ボーダー: `border-gray-300`
- ホバー: `bg-gray-100`
- パディング: `px-3 py-1.5`

#### アイテム選択ボタン（ルーン、アイテム、スペル）

**スタイル定数**:
```tsx
export const ITEM_BTN_BASE =
  'relative flex flex-col items-center gap-1 p-3 rounded border transition-colors duration-150';
export const ITEM_BTN_ACTIVE =
  'bg-pink-100 border-pink-200 text-pink-700 shadow-sm ring-2 ring-pink-50';
export const ITEM_BTN_INACTIVE =
  'bg-white border-gray-200 text-gray-700 hover:bg-pink-50 hover:border-pink-100';
export const ITEM_BTN_DISABLED = 'opacity-60 cursor-not-allowed';
```

**ユーティリティ関数**:
```tsx
export function itemBtnClass(options: {
  active?: boolean;
  disabled?: boolean;
  extra?: string;
} = {}) {
  const { active = false, disabled = false, extra = '' } = options;
  return `${ITEM_BTN_BASE} ${active ? ITEM_BTN_ACTIVE : ITEM_BTN_INACTIVE} ${disabled ? ITEM_BTN_DISABLED : ''} ${extra}`.trim();
}
```

**使用例**:
```tsx
<button
  className={itemBtnClass({ active: isSelected, disabled: isDisabled })}
  onClick={handleClick}
>
  <Image src={icon} alt={name} width={44} height={44} />
  <div className="text-xs text-center">{name}</div>
</button>
```

### 入力フィールド

#### テキスト入力
```tsx
<input
  type="text"
  placeholder="サモナー名 / チャンピオンを検索…"
  className="h-11 w-full rounded-lg border px-4 text-[15px] outline-none focus:border-gray-400"
/>
```

**特徴**:
- 高さ: `h-11` (44px)
- 角丸: `rounded-lg`
- パディング: `px-4`
- フォーカス: `focus:border-gray-400`
- アウトライン: `outline-none`

#### テキストエリア
```tsx
<textarea
  placeholder="対策メモを入力"
  className="mb-2 px-3 py-2 border border-gray-200 rounded w-full text-sm transition-colors duration-150 hover:border-gray-300 focus:outline-none focus:ring-0 focus:border-gray-300 min-h-[120px] max-h-[320px] resize-vertical overflow-auto"
/>
```

**特徴**:
- 最小高さ: `min-h-[120px]`
- 最大高さ: `max-h-[320px]`
- リサイズ: `resize-vertical`
- ホバー: `hover:border-gray-300`
- フォーカス: `focus:border-gray-300`

#### 共通入力スタイル定数
```tsx
export const BORDER_STYLE_1 =
  'mb-2 px-3 py-2 border border-gray-200 rounded w-full text-sm focus:outline-none focus:ring-0';
```

### 検索バー

```tsx
<form onSubmit={onSubmit} className="flex w-full max-w-2xl gap-2">
  <input
    value={query}
    onChange={(e) => setQuery(e.target.value)}
    placeholder="サモナー名 / チャンピオンを検索…"
    className="h-11 w-full rounded-lg border px-4 text-[15px] outline-none focus:border-gray-400"
  />
  <button
    type="submit"
    className="h-11 rounded-lg bg-gray-700 px-4 text-white hover:bg-gray-800"
  >
    検索
  </button>
</form>
```

**特徴**:
- 最大幅: `max-w-2xl` (672px)
- フレックス: `flex gap-2`
- 入力とボタンの高さ統一: `h-11`

### チップ（Chips）

#### 最近検索チップ
```tsx
<div className="space-y-3">
  <div className="text-lg font-medium text-gray-900">最近検索</div>
  <div className="flex flex-wrap gap-3">
    {items.map((item) => (
      <button
        key={item}
        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-gray-800 hover:bg-gray-100 transition"
      >
        {item}
      </button>
    ))}
  </div>
</div>
```

#### ピン留めチップ
```tsx
<div className="space-y-3">
  <div className="text-lg font-medium">ピン留め</div>
  <div className="flex flex-wrap gap-3">
    {pins.map((name) => (
      <button
        key={name}
        className="rounded-lg border px-4 py-2 text-gray-800 hover:bg-gray-50"
      >
        {name}
      </button>
    ))}
  </div>
</div>
```

**共通パターン**:
- コンテナ: `space-y-3` (見出しとチップ群の間隔)
- チップ群: `flex flex-wrap gap-3`
- 角丸: `rounded-lg`
- ホバー効果: `hover:bg-gray-50` または `hover:bg-gray-100`

## ローディングUI

### GlobalLoading コンポーネント

#### 実装
```tsx
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

**特徴**:
- 位置: 右下固定 (`fixed`, `right: 24px`, `bottom: 24px`)
- z-index: `9999` (最前面)
- 画像: `/images/loading/nunu.gif` (GIFアニメーション)
- サイズ: `240x240px`
- 条件表示: `loading` が `false` の場合は非表示

**重要**: GIFアニメーションは `<img>` タグを使用（Next.js `<Image>` は使用不可）

#### 使用パターン

**Navbar での使用**:
```tsx
const [loading, setLoading] = useState(false);

// ログイン時
<button
  onClick={() => {
    setLoading(true);
    signIn('google');
  }}
>
  ログイン
</button>

// ログアウト時
<button
  onClick={() => {
    setLoading(true);
    signOut();
  }}
>
  ログアウト
</button>

// レンダリング
<GlobalLoading loading={loading} />
```

**データフェッチ時の使用**:
```tsx
const [loading, setLoading] = useState(false);

useEffect(() => {
  setLoading(true);
  fetch('/api/endpoint')
    .then(res => res.json())
    .then(data => {
      setData(data);
      setLoading(false);
    })
    .catch(() => setLoading(false));
}, []);

return (
  <>
    {/* コンテンツ */}
    <GlobalLoading loading={loading} />
  </>
);
```

### ページローディング（Next.js）

```tsx
// app/loading.tsx
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
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

**用途**: ページ遷移時の自動ローディング表示

## 画像表示パターン

### Next.js Image（静的画像）

```tsx
import Image from 'next/image';

<Image
  src="/images/champion/Ahri.png"
  alt="Ahri"
  width={48}
  height={48}
/>
```

**用途**:
- チャンピオン画像
- アイテム画像
- ルーン画像
- 静的PNG/JPG画像

**メリット**:
- 自動最適化
- 遅延読み込み
- WebP自動変換

### 通常のimgタグ（GIFアニメーション）

```tsx
{/* eslint-disable-next-line @next/next/no-img-element */}
<img
  src="/images/loading/nunu.gif"
  alt="Loading"
  width={240}
  height={240}
/>
```

**用途**:
- GIFアニメーション専用

**理由**:
- Next.js ImageはGIFアニメーションに非対応
- `<Image>` を使うと400エラーが発生

**必須**: ESLint警告抑制コメントを追加

### 画像パス規則

- **絶対パス**: `/` から始める（例: `/images/champion/Ahri.png`）
- **相対パス**: 使用しない
- **public配下**: `/images/` ディレクトリに配置
  - `/images/champion/` - チャンピオン画像
  - `/images/item/` - アイテム画像
  - `/images/runes/` - ルーン画像
  - `/images/loading/` - ローディングGIF

## グリッドレイアウトパターン

### アイテムグリッド（4-8カラム）

```tsx
<div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
  {items.map(item => (
    <button key={item.id} className={itemBtnClass({ active: isSelected })}>
      <Image src={item.icon} alt={item.name} width={44} height={44} />
      <div className="text-xs text-center">{item.name}</div>
    </button>
  ))}
</div>
```

**特徴**:
- モバイル: 4カラム (`grid-cols-4`)
- デスクトップ: 8カラム (`sm:grid-cols-8`)
- 間隔: `gap-3` (12px)

### チャンピオングリッド（6-12カラム）

```tsx
<div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
  {champions.map(champ => (
    <button key={champ.id}>
      <Image src={champ.icon} alt={champ.name} width={48} height={48} />
    </button>
  ))}
</div>
```

## レスポンシブデザイン

### ブレークポイント

- **sm**: `640px` - タブレット
- **md**: `768px` - デスクトップ
- **lg**: `1024px` - 大画面
- **xl**: `1280px` - 超大画面

### レスポンシブパターン

#### ナビゲーション
```tsx
{/* モバイル: 非表示、デスクトップ: 表示 */}
<nav className="hidden gap-8 md:flex">
  <Link href="/">ホーム</Link>
</nav>
```

#### グリッド
```tsx
{/* モバイル: 1カラム、デスクトップ: 3カラム */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
```

#### 2カラムレイアウト
```tsx
{/* モバイル: 1カラム、デスクトップ: メイン+サイド */}
<section className="grid gap-8 md:grid-cols-[1fr,320px]">
```

## アクセシビリティ

### 必須属性

#### 画像
```tsx
<img src="/image.png" alt="説明テキスト" />
<Image src="/image.png" alt="説明テキスト" width={48} height={48} />
```

#### ボタン
```tsx
<button aria-label="ログイン">ログイン</button>
<button aria-pressed={isActive}>選択</button>
```

#### フォーム
```tsx
<label htmlFor="username">ユーザー名</label>
<input id="username" type="text" />
```

### セマンティックHTML

```tsx
{/* Good */}
<nav>
  <ul>
    <li><Link href="/">ホーム</Link></li>
  </ul>
</nav>

<main>
  <section>
    <h1>見出し</h1>
  </section>
</main>

<footer>
  <p>フッター</p>
</footer>
```

## トランジション・アニメーション

### 標準トランジション

```tsx
{/* ボタンホバー */}
<button className="transition hover:bg-gray-100">

{/* カラートランジション */}
<button className="transition-colors duration-150">

{/* 複数プロパティ */}
<button className="transition-all duration-200">
```

### ホバー効果

```tsx
{/* 背景色変化 */}
<button className="hover:bg-gray-100">

{/* テキスト色変化 */}
<Link className="text-gray-500 hover:text-[var(--foreground)]">

{/* ボーダー色変化 */}
<input className="border focus:border-gray-400">
```

## データ表示パターン

### 空状態（Empty State）

```tsx
if (items.length === 0) return null;

// または
if (items.length === 0) {
  return (
    <div className="text-center py-8 text-gray-500">
      <p>データがありません</p>
    </div>
  );
}
```

### リスト表示

```tsx
<div className="space-y-3">
  <div className="text-lg font-medium">見出し</div>
  <div className="flex flex-wrap gap-3">
    {items.map(item => (
      <div key={item.id}>{/* アイテム */}</div>
    ))}
  </div>
</div>
```

## フォームパターン

### 読み取り専用モード

```tsx
<input
  value={value}
  onChange={(e) => setValue(e.target.value)}
  readOnly={readOnly}
  className="..."
/>

<button
  onClick={handleClick}
  disabled={readOnly}
  className="..."
>
```

**ルール**:
- `readOnly` プロップで制御
- 読み取り専用時も見た目は変えない（`opacity` 等を適用しない）
- インタラクションのみ無効化

### フォーム送信

```tsx
<form onSubmit={handleSubmit} className="space-y-4">
  <input type="text" />
  <button type="submit">送信</button>
</form>

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  // 処理
};
```

## 状態管理パターン

### ローカルストレージ

```tsx
// storage.ts
export function getRecent(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('lollab_recent_v1') || '[]');
  } catch {
    return [];
  }
}

export function addRecent(q: string, limit = 6) {
  if (!q) return;
  const list = [q, ...getRecent().filter(v => v !== q)].slice(0, limit);
  localStorage.setItem('lollab_recent_v1', JSON.stringify(list));
}
```

**パターン**:
- SSR対応: `typeof window === 'undefined'` チェック
- エラーハンドリング: `try-catch` で安全に処理
- バージョニング: キー名に `_v1` を付与

### React Hooks

```tsx
const [data, setData] = useState<Type | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  setLoading(true);
  fetch('/api/endpoint')
    .then(res => res.json())
    .then(data => {
      setData(data);
      setLoading(false);
    })
    .catch(err => {
      setError(err.message);
      setLoading(false);
    });
}, []);
```

## 命名規則

### コンポーネント
- **ファイル名**: PascalCase（例: `GlobalLoading.tsx`）
- **コンポーネント名**: ファイル名と一致

### 変数・関数
- **boolean**: `is`, `has`, `should` で始める（例: `isLoading`, `hasError`）
- **関数**: 動詞で始める（例: `fetchData`, `handleClick`）
- **イベントハンドラ**: `handle` で始める（例: `handleSubmit`, `handleChange`）

### 定数
- **スタイル定数**: UPPER_SNAKE_CASE（例: `ITEM_BTN_BASE`, `BORDER_STYLE_1`）
- **データ定数**: UPPER_SNAKE_CASE（例: `START_ITEMS`, `CHAMPIONS`）

## 今後の拡張予定

### 短期（1-3ヶ月）
- エラー表示パターン（トースト、インラインエラー）
- モーダル/ダイアログパターン
- ドロップダウンメニューパターン
- ツールチップパターン

### 中期（3-6ヶ月）
- スケルトンスクリーンローディング
- プログレスバー
- タブナビゲーション
- アコーディオン

### 長期（6ヶ月以降）
- ダークモード対応
- アニメーション強化
- マイクロインタラクション
- アクセシビリティ強化

## 参照ドキュメント

- `frontend-coding-guidelines.md`: コーディング規約
- `structure.md`: ファイル構造
- `tech.md`: 技術スタック

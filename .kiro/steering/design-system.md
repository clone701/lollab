# デザインシステム

## 概要

LoL Labプロジェクトのデザインシステムとスタイルガイドラインを定義します。

## フォント

### プロジェクト共通フォント

**Noto Sans JP**: プロジェクト全体で使用する日本語フォント

```typescript
// frontend/src/app/layout.tsx
import { Noto_Sans_JP } from 'next/font/google';

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-sans-jp',
});

// HTMLに適用
<html lang="ja" className={notoSansJP.variable}>
  <body className={notoSansJP.className}>
```

```javascript
// frontend/tailwind.config.js
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

## カラーパレット

### プライマリカラー（ピンク系）

**用途**: ブランドカラー、CTA、リンク

```typescript
const primary = {
  50: '#fdf2f8',   // 背景（極薄）
  100: '#fce7f3',  // 背景（薄）
  200: '#fbcfe8',  // ボーダー
  300: '#f9a8d4',  // ボーダー（強調）
  400: '#f472b6',  // ホバー
  500: '#ec4899',  // メイン
  600: '#db2777',  // アクティブ
  700: '#be185d',  // テキスト（強調）
  800: '#9f1239',  // テキスト（濃）
  900: '#831843',  // テキスト（最濃）
};
```

**Tailwindクラス**: `bg-pink-500`, `text-pink-600`, `border-pink-300`

### グレー系

**用途**: テキスト、背景、ボーダー

```typescript
const gray = {
  50: '#f9fafb',   // 背景（極薄）
  100: '#f3f4f6',  // 背景（薄）
  200: '#e5e7eb',  // ボーダー
  300: '#d1d5db',  // ボーダー（濃）
  400: '#9ca3af',  // テキスト（薄）
  500: '#6b7280',  // テキスト（中）
  600: '#4b5563',  // テキスト（標準）
  700: '#374151',  // テキスト（濃）
  800: '#1f2937',  // テキスト（強調）
  900: '#111827',  // テキスト（最濃）
};
```

**Tailwindクラス**: `bg-gray-50`, `text-gray-600`, `border-gray-200`

### ブラック系

**用途**: 選択状態のハイライト、強調表示

```typescript
const black = {
  DEFAULT: '#000000',  // 純黒
  800: '#1f2937',      // グレーブラック
  900: '#111827',      // ダークグレー
};
```

**Tailwindクラス**: `bg-black`, `text-black`, `border-black`

## 選択状態のスタイル

### ハイライトカラー

**重要**: 選択状態のハイライトは**黒（ブラック）**を使用する

```typescript
// ✅ 正しい例
<div className="bg-gray-100 border-2 border-black">選択中</div>

// ❌ 間違った例
<div className="bg-pink-100 border-2 border-pink-300">選択中</div>
```

### 選択状態のパターン

#### パターン1: 背景 + ボーダー
```typescript
<button className={`
  ${selected 
    ? 'bg-gray-100 border-2 border-black' 
    : 'hover:bg-gray-50'
  }
`}>
```

#### パターン2: リング（円形画像など）
```typescript
<img className={`
  rounded-full
  ${selected 
    ? 'ring-2 ring-black' 
    : 'hover:ring-2 hover:ring-gray-300'
  }
`} />
```

#### パターン3: 下線（タブなど）
```typescript
<button className={`
  border-b-2
  ${isActive 
    ? 'border-black text-black' 
    : 'border-transparent text-gray-600'
  }
`}>
```

## タイポグラフィ

### フォントサイズ

```typescript
const fontSize = {
  xs: '0.75rem',    // 12px - 補助テキスト
  sm: '0.875rem',   // 14px - 標準テキスト
  base: '1rem',     // 16px - 本文
  lg: '1.125rem',   // 18px - 小見出し
  xl: '1.25rem',    // 20px - 見出し
  '2xl': '1.5rem',  // 24px - 大見出し
};
```

### フォントウェイト

```typescript
const fontWeight = {
  normal: '400',    // 通常テキスト
  medium: '500',    // 強調テキスト
  semibold: '600',  // 見出し
  bold: '700',      // 強調見出し
};
```

## スペーシング

### パディング

```typescript
const padding = {
  xs: 'p-1',      // 4px
  sm: 'p-1.5',    // 6px
  base: 'p-2',    // 8px
  md: 'p-3',      // 12px
  lg: 'p-4',      // 16px
  xl: 'p-6',      // 24px
};
```

### マージン

```typescript
const margin = {
  xs: 'mb-1',     // 4px
  sm: 'mb-2',     // 8px
  base: 'mb-3',   // 12px
  md: 'mb-4',     // 16px
  lg: 'mb-6',     // 24px
  xl: 'mb-8',     // 32px
};
```

### ギャップ

```typescript
const gap = {
  xs: 'gap-1',    // 4px
  sm: 'gap-2',    // 8px
  base: 'gap-3',  // 12px
  md: 'gap-4',    // 16px
  lg: 'gap-6',    // 24px
};
```

## コンポーネントサイズ

### 画像サイズ

```typescript
const imageSize = {
  xs: 'w-6 h-6',      // 24px - アイコン
  sm: 'w-8 h-8',      // 32px - 小さいアバター
  base: 'w-12 h-12',  // 48px - 標準アバター
  lg: 'w-16 h-16',    // 64px - 大きいアバター
  xl: 'w-20 h-20',    // 80px - 特大アバター
};
```

### ボタンサイズ

```typescript
const buttonSize = {
  sm: 'px-2 py-1 text-xs',      // 小
  base: 'px-3 py-1.5 text-sm',  // 標準
  md: 'px-4 py-2 text-sm',      // 中
  lg: 'px-6 py-3 text-base',    // 大
};
```

## ボーダー

### ボーダー幅

```typescript
const borderWidth = {
  DEFAULT: 'border',      // 1px
  2: 'border-2',          // 2px - 選択状態
  4: 'border-4',          // 4px - 強調
};
```

### ボーダー半径

```typescript
const borderRadius = {
  none: 'rounded-none',     // 0px
  sm: 'rounded-sm',         // 2px
  base: 'rounded',          // 4px
  md: 'rounded-md',         // 6px
  lg: 'rounded-lg',         // 8px
  full: 'rounded-full',     // 9999px - 円形
};
```

## シャドウ

```typescript
const shadow = {
  sm: 'shadow-sm',      // 軽いシャドウ
  base: 'shadow',       // 標準シャドウ
  md: 'shadow-md',      // 中程度のシャドウ
  lg: 'shadow-lg',      // 大きいシャドウ
  xl: 'shadow-xl',      // 特大シャドウ
};
```

## トランジション

```typescript
const transition = {
  fast: 'duration-150',     // 150ms - 標準
  base: 'duration-200',     // 200ms
  slow: 'duration-300',     // 300ms
};
```

**使用例**:
```typescript
<button className="transition-colors duration-150 hover:bg-gray-100">
```

## レイアウト

### サイドバー幅

```typescript
const sidebarWidth = {
  narrow: 'w-64',   // 256px
  base: 'w-80',     // 320px - 標準
  wide: 'w-96',     // 384px
};
```

### コンテナ幅

```typescript
const containerWidth = {
  sm: 'max-w-screen-sm',    // 640px
  md: 'max-w-screen-md',    // 768px
  lg: 'max-w-screen-lg',    // 1024px
  xl: 'max-w-screen-xl',    // 1280px
  '2xl': 'max-w-screen-2xl', // 1536px
};
```

## アクセシビリティ

### フォーカス状態

```typescript
<button className="focus:outline-none focus:ring-2 focus:ring-pink-500">
```

### ARIA属性

```typescript
<button 
  aria-label="チャンピオンを選択"
  aria-pressed={selected}
>
```

## 使用例

### チャンピオン選択ボタン

```typescript
<button className={`
  flex items-center gap-2 p-1.5 rounded w-full
  transition-colors duration-150
  ${selected 
    ? 'bg-gray-100 border-2 border-black' 
    : 'hover:bg-gray-50'
  }
`}>
  <img className="w-8 h-8 rounded-full" />
  <span className="text-xs">{name}</span>
</button>
```

### タブナビゲーション

```typescript
<button className={`
  px-3 py-2 text-sm font-medium
  border-b-2 transition-colors duration-150
  ${isActive 
    ? 'border-black text-black' 
    : 'border-transparent text-gray-600 hover:text-gray-800'
  }
`}>
  {label}
</button>
```

### よく使うチャンピオン

```typescript
<img className={`
  w-12 h-12 rounded-full
  transition-all duration-150
  ${selected 
    ? 'ring-2 ring-black' 
    : 'hover:ring-2 hover:ring-gray-300'
  }
`} />
```

## 禁止事項

### ❌ 選択状態にピンク色を使用しない

```typescript
// ❌ 間違い
<div className="bg-pink-100 border-2 border-pink-300">選択中</div>

// ✅ 正しい
<div className="bg-gray-100 border-2 border-black">選択中</div>
```

### ❌ 過度に大きいサイズを使用しない

```typescript
// ❌ 間違い
<img className="w-20 h-20" /> // 80px - 大きすぎる

// ✅ 正しい
<img className="w-8 h-8" />   // 32px - 適切
```

### ❌ 不必要なスペーシングを使用しない

```typescript
// ❌ 間違い
<div className="p-8 mb-10">  // 過度なスペース

// ✅ 正しい
<div className="p-4 mb-4">   // 適切なスペース
```

## 今後の拡張

- ダークモード対応
- アニメーション定義
- レスポンシブブレークポイント詳細
- カスタムコンポーネントライブラリ

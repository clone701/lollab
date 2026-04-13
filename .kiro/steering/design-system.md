---
inclusion: fileMatch
fileMatchPattern: 'frontend/**/*.{tsx,ts,jsx,js,css}'
---

# デザインシステム

## 概要

LoL Labプロジェクトのデザインシステムとスタイルガイドラインを定義します。

## フォント

**Noto Sans JP**: プロジェクト全体で使用する日本語フォント（実装済み）

## カラーパレット

### グレー系（プライマリ）

**用途**: ボタン、テキスト、背景、ボーダー

- **CTA**: `bg-gray-800` (メインボタン)
- **テキスト**: `text-gray-600` (標準), `text-gray-800` (強調)
- **背景**: `bg-gray-50` (薄), `bg-gray-100` (中)
- **ボーダー**: `border-gray-200` (標準), `border-gray-300` (強調)

### ゴールド系（選択状態）

**用途**: 選択状態のハイライト

**パターン**: `ring-2 ring-amber-400 shadow-md shadow-amber-400/30 bg-amber-50/50`

```typescript
<button className={`
  ${selected 
    ? 'ring-2 ring-amber-400 shadow-md shadow-amber-400/30 bg-amber-50/50' 
    : 'hover:ring-2 hover:ring-gray-300 bg-white'
  }
`}>
```

## タイポグラフィ

- **サイズ**: `text-xs` (12px), `text-sm` (14px), `text-base` (16px), `text-xl` (20px)
- **ウェイト**: `font-normal` (400), `font-medium` (500), `font-semibold` (600), `font-bold` (700)

## スペーシング

- **パディング**: `p-1` (4px), `p-1.5` (6px), `p-2` (8px), `p-3` (12px), `p-4` (16px)
- **マージン**: `mb-2` (8px), `mb-3` (12px), `mb-4` (16px), `mb-6` (24px)
- **ギャップ**: `gap-2` (8px), `gap-3` (12px), `gap-4` (16px)

## コンポーネントサイズ

- **画像**: `w-8 h-8` (32px), `w-12 h-12` (48px)
- **ボタン**: `px-3 py-1.5 text-sm` (標準), `px-4 py-2 text-sm` (中)

## その他

- **ボーダー**: `border` (1px), `border-2` (2px), `rounded` (4px), `rounded-lg` (8px), `rounded-full` (円形)
- **シャドウ**: `shadow-sm`, `shadow`, `shadow-md`
- **透明度**: `bg-black/20` (20%), `bg-white/50` (50%), `shadow-amber-400/30` (30%) - スラッシュ記法を使用
- **トランジション**: `transition-colors duration-150`
- **フォーカス**: `focus:outline-none focus:ring-2 focus:ring-gray-800`

## 使用例

### CTAボタン
```typescript
<button className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700">
```

### 選択状態
```typescript
<div className={selected ? 'ring-2 ring-amber-400 shadow-md shadow-amber-400/30 bg-amber-50/50' : ''}>
```

### オーバーレイ（モーダル背景）
```typescript
<div className="fixed inset-0 bg-black/20">
```

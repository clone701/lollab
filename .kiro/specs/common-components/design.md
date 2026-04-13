# 設計書: 共通コンポーネント

## 概要

本ドキュメントは、プロジェクト全体で使用する共通UIコンポーネントとスタイルユーティリティの設計を定義します。

## ファイル構成

```
frontend/src/components/ui/Panel.tsx
frontend/src/components/ui/styles.ts
```

## Panel コンポーネント

**場所**: `frontend/src/components/ui/Panel.tsx`

**責務**: 汎用的なパネルコンテナ

**Props**:
```typescript
interface PanelProps {
  children: React.ReactNode;
  className?: string;
}
```

**スタイル仕様**:
- パディング: 16px
- ボーダー: 透明
- 角丸: 4px
- 背景: 白

**使用例**:
```typescript
<Panel>
  <h2>タイトル</h2>
  <p>コンテンツ</p>
</Panel>

<Panel className="shadow-lg mb-4">
  <div>カスタムパネル</div>
</Panel>
```

## アイテムボタンスタイル定数

**場所**: `frontend/src/components/ui/styles.ts`

**責務**: アイテム選択ボタンの共通スタイル定義

**定数**:
```typescript
export const ITEM_BTN_BASE: string;
export const ITEM_BTN_ACTIVE: string;
export const ITEM_BTN_INACTIVE: string;
export const ITEM_BTN_DISABLED: string;
```

**スタイル仕様**:
- **ITEM_BTN_BASE**: 基本スタイル（レイアウト、トランジション）
- **ITEM_BTN_ACTIVE**: アクティブ状態（ピンク背景、ピンクボーダー、シャドウ）
- **ITEM_BTN_INACTIVE**: 非アクティブ状態（白背景、グレーボーダー、ホバー効果）
- **ITEM_BTN_DISABLED**: 無効状態（opacity-60、cursor-not-allowed）

## itemBtnClass ユーティリティ関数

**場所**: `frontend/src/components/ui/styles.ts`

**責務**: アイテムボタンのクラス名を生成

**シグネチャ**:
```typescript
interface ItemBtnClassOptions {
  active?: boolean;
  disabled?: boolean;
  extra?: string;
}

function itemBtnClass(options?: ItemBtnClassOptions): string
```

**使用例**:
```typescript
// 基本（非アクティブ）
<button className={itemBtnClass()}>アイテム</button>

// アクティブ
<button className={itemBtnClass({ active: true })}>選択中</button>

// 無効
<button className={itemBtnClass({ disabled: true })} disabled>無効</button>

// カスタムクラス追加
<button className={itemBtnClass({ active: true, extra: 'w-full' })}>
  フル幅
</button>
```

## 入力フィールドスタイル定数

**場所**: `frontend/src/components/ui/styles.ts`

**責務**: 入力フィールドの共通スタイル定義

**定数**:
```typescript
export const BORDER_STYLE_1: string;
```

**スタイル仕様**:
- パディング: 12px（横）、8px（縦）
- ボーダー: グレー、1px
- 角丸: 4px
- ホバー: グレーボーダー（濃）
- フォーカス: グレーボーダー（濃）、アウトラインなし

**使用例**:
```typescript
// input
<input
  type="text"
  className={BORDER_STYLE_1}
  placeholder="テキストを入力"
/>

// textarea
<textarea
  className={`${BORDER_STYLE_1} min-h-[120px]`}
  placeholder="メモを入力"
/>
```

## 技術的制約

- Tailwind CSS 4を使用
- TypeScript 5を使用
- React 19を使用

## 使用方針

### Panelコンポーネント

- コンテンツをグループ化する際に使用
- カスタムスタイルはclassName propで追加
- ネストも可能

### アイテムボタンスタイル

- ルーン、スペル、アイテム選択ボタンで使用
- active/disabled状態を適切に管理
- 一貫したUI/UXを提供

### 入力フィールドスタイル

- テキスト入力、テキストエリアで使用
- 一貫したフォーカス状態を提供
- カスタムスタイルは追加で指定

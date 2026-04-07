# 設計書: 共通コンポーネント

## ファイル構成

```
frontend/src/components/ui/Panel.tsx
```

---

## Panel コンポーネント

### Props

```typescript
interface PanelProps {
  children: React.ReactNode;
  className?: string;
}
```

### 実装

```typescript
export default function Panel({ children, className = '' }: PanelProps) {
  return (
    <div className={`p-4 border border-transparent rounded bg-white ${className}`.trim()}>
      {children}
    </div>
  );
}
```

**スタイル**:
- `p-4`: 16pxパディング
- `border border-transparent`: 透明ボーダー
- `rounded`: 4px角丸
- `bg-white`: 白背景

### 使用例

```typescript
// 基本
<Panel>
  <h2>タイトル</h2>
  <p>コンテンツ</p>
</Panel>

// カスタムスタイル
<Panel className="shadow-lg mb-4">
  <div>カスタムパネル</div>
</Panel>
```

---

## アイテムボタンスタイル定数

### 定数定義

```typescript
export const ITEM_BTN_BASE =
  'relative flex flex-col items-center gap-1 p-3 rounded border transition-colors duration-150';

export const ITEM_BTN_ACTIVE =
  'bg-pink-100 border-pink-200 text-pink-700 shadow-sm ring-2 ring-pink-50';

export const ITEM_BTN_INACTIVE =
  'bg-white border-gray-200 text-gray-700 hover:bg-pink-50 hover:border-pink-100';

export const ITEM_BTN_DISABLED = 
  'opacity-60 cursor-not-allowed';
```

---

## itemBtnClass ユーティリティ関数

### 型定義

```typescript
interface ItemBtnClassOptions {
  active?: boolean;
  disabled?: boolean;
  extra?: string;
}
```

### 実装

```typescript
export function itemBtnClass(options: ItemBtnClassOptions = {}): string {
  const { active = false, disabled = false, extra = '' } = options;
  
  return `${ITEM_BTN_BASE} ${active ? ITEM_BTN_ACTIVE : ITEM_BTN_INACTIVE} ${disabled ? ITEM_BTN_DISABLED : ''} ${extra}`.trim();
}
```

### 使用例

```typescript
// 基本（非アクティブ）
<button className={itemBtnClass()}>
  <Image src="/icon.png" alt="Item" width={44} height={44} />
  <div className="text-xs">アイテム名</div>
</button>

// アクティブ
<button className={itemBtnClass({ active: true })}>
  <Image src="/icon.png" alt="Item" width={44} height={44} />
  <div className="text-xs">選択中</div>
</button>

// 無効
<button className={itemBtnClass({ disabled: true })} disabled>
  <Image src="/icon.png" alt="Item" width={44} height={44} />
  <div className="text-xs">無効</div>
</button>
```

---

## 入力フィールドスタイル定数

### 定数定義

```typescript
export const BORDER_STYLE_1 =
  'mb-2 px-3 py-2 border border-gray-200 rounded w-full text-sm transition-colors duration-150 hover:border-gray-300 focus:outline-none focus:ring-0 focus:border-gray-300';
```

### 使用例

```typescript
// input
<input
  type="text"
  placeholder="テキストを入力"
  className={BORDER_STYLE_1}
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>

// textarea
<textarea
  placeholder="メモを入力"
  className={`${BORDER_STYLE_1} min-h-[120px] resize-vertical`}
  value={memo}
  onChange={(e) => setMemo(e.target.value)}
/>
```

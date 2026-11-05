// Panel コンポーネントとアイテムボタンスタイルユーティリティ

// ========================================
// 型定義
// ========================================

/**
 * Panel コンポーネントのプロップス
 */
interface PanelProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * itemBtnClass 関数のオプション
 */
interface ItemBtnClassOptions {
  active?: boolean;
  disabled?: boolean;
  extra?: string;
}

// ========================================
// スタイル定数
// ========================================

/**
 * アイテムボタンの基本スタイル
 */
export const ITEM_BTN_BASE =
  'relative flex flex-col items-center gap-1 p-3 rounded border transition-colors duration-150';

/**
 * アイテムボタンのアクティブ状態スタイル（ピンク系カラー）
 */
export const ITEM_BTN_ACTIVE =
  'ring-2 ring-accent bg-accent/15 border-transparent text-fg';

/**
 * アイテムボタンの非アクティブ状態スタイル（グレー系カラー、ホバー効果）
 */
export const ITEM_BTN_INACTIVE =
  'bg-surface-2 border-line text-fg-muted hover:ring-2 hover:ring-accent/60';

/**
 * アイテムボタンの無効状態スタイル
 */
export const ITEM_BTN_DISABLED = 'opacity-60 cursor-not-allowed';

/**
 * 入力フィールドの共通スタイル
 */
export const BORDER_STYLE_1 =
  'mb-2 px-3 py-2 border border-line rounded w-full text-sm transition-colors duration-150 hover:border-line-strong focus:outline-none focus:ring-0 focus:border-line-strong';

// ========================================
// ユーティリティ関数
// ========================================

/**
 * アイテムボタンのクラス名を生成するユーティリティ関数
 *
 * @param options - ボタンの状態オプション
 * @param options.active - アクティブ状態（デフォルト: false）
 * @param options.disabled - 無効状態（デフォルト: false）
 * @param options.extra - 追加のクラス名（デフォルト: ''）
 * @returns 結合されたクラス名文字列
 */
export function itemBtnClass(options: ItemBtnClassOptions = {}): string {
  const { active = false, disabled = false, extra = '' } = options;

  return `${ITEM_BTN_BASE} ${active ? ITEM_BTN_ACTIVE : ITEM_BTN_INACTIVE} ${disabled ? ITEM_BTN_DISABLED : ''} ${extra}`.trim();
}

// ========================================
// Panel コンポーネント
// ========================================

/**
 * 汎用パネルコンテナコンポーネント
 *
 * @param props - コンポーネントのプロップス
 * @param props.children - パネル内に表示する子要素
 * @param props.className - 追加のCSSクラス名（オプション）
 * @returns パネルコンポーネント
 */
export default function Panel({ children, className = '' }: PanelProps) {
  return (
    <div
      className={`p-4 border border-transparent rounded bg-surface ${className}`.trim()}
    >
      {children}
    </div>
  );
}

import React from 'react';

type Props = {
  children: React.ReactNode;
  className?: string;
};

/**
 * 共通で使う枠線/入力スタイル文字列（必要なら直接利用可能）
 */
export const BORDER_STYLE_1 =
  'mb-2 px-3 py-2 border border-gray-200 rounded w-full text-sm focus:outline-none focus:ring-0';

/**
 * 初期アイテム（等）のボタンに使うスタイル群
 *
 * 用途:
 * - ITEM_BTN_BASE: ボタンのベースレイアウト（パディング / 並び / トランジション等）
 * - ITEM_BTN_ACTIVE: 選択済み状態に付与する見た目（背景 / ボーダー / テキスト色 / ring など）
 * - ITEM_BTN_INACTIVE: 未選択状態の見た目（通常 / hover 用クラス含む）
 * - ITEM_BTN_DISABLED: 無効化時の見た目（透過・カーソル不可）
 *
 * これらをコンポーネント側で組み合わせて使うことで見た目を統一できます。
 */
export const ITEM_BTN_BASE =
  'relative flex flex-col items-center gap-1 p-3 rounded border transition-colors duration-150';
export const ITEM_BTN_ACTIVE =
  'bg-pink-100 border-pink-200 text-pink-700 shadow-sm ring-2 ring-pink-50';
export const ITEM_BTN_INACTIVE =
  'bg-white border-gray-200 text-gray-700 hover:bg-pink-50 hover:border-pink-100';
export const ITEM_BTN_DISABLED = 'opacity-60 cursor-not-allowed';

// 追加: 状態に応じたクラスを返すユーティリティ関数
export function itemBtnClass(options: {
  active?: boolean;
  disabled?: boolean;
  extra?: string;
} = {}) {
  const { active = false, disabled = false, extra = '' } = options;
  return `${ITEM_BTN_BASE} ${active ? ITEM_BTN_ACTIVE : ITEM_BTN_INACTIVE} ${disabled ? ITEM_BTN_DISABLED : ''} ${extra}`.trim();
}

/**
 * Panel
 *
 * 用途:
 * - 画面内の「カード」や「セクション」を囲む汎用パネル。
 * - デフォルトでは背景を白にして角丸にし、内側のパディングを確保する。
 *
 * Tailwind クラス説明:
 * - p-4: 内側の余白を均等に取る（padding: 1rem）。
 * - border: 1px のボーダーを有効にする（ただし色は下で透明指定）。
 * - border-transparent: 境界線色を透明にする（枠線を表示しないがレイアウトは維持）。
 * - rounded: 角をわずかに丸める（border-radius: 0.25rem）。
 * - bg-white: 背景色を白にする。
 *
 * 備考:
 * - className を渡せば追加スタイルを付与可能。
 * - 見た目の「枠」は透明（border-transparent）にしておき、必要な場所で枠色を上書きできます。
 */
export function Panel({ children, className = '' }: Props) {
  return <div className={`p-4 border border-transparent rounded bg-white ${className}`.trim()}>{children}</div>;
}

/**
 * 既存コード互換のため default export も残す
 */
export default Panel;
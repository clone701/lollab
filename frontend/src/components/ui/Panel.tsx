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
 * BorderStyle1
 *
 * 用途:
 * - 単独で「入力欄などに使う枠線スタイル」を適用したいときに使うラッパーコンポーネント。
 * - <BorderStyle1>...</BorderStyle1> のように中身をラップして使うことを想定。
 *
 * Tailwind クラス説明（枠線スタイル1）:
 * - mb-2: 要素下のマージンを小さく取る（margin-bottom: 0.5rem）。
 * - px-3: 左右のパディングを設定（padding-left/right: 0.75rem）。
 * - py-2: 上下のパディングを設定（padding-top/bottom: 0.5rem）。
 * - border: 1px ボーダーを有効化（枠線の存在を示す）。
 * - border-gray-200: 枠線色を薄いグレーに設定（控えめな境界線）。
 * - rounded: 角を丸める（border-radius: 0.25rem）。
 * - w-full: 横幅を親要素いっぱいに広げる（width: 100%）。
 * - text-sm: 小さいフォントサイズ（入力に適したサイズ）。
 * - focus:outline-none: フォーカス時のブラウザ既定アウトラインを消す（フォーカスリングは別管理）。
 * - focus:ring-0: Tailwind の ring を無効化（外枠が太くならないように）。
 *
 * 備考:
 * - ホバー・フォーカス時の色変化等は含めていません（ユーザー指定で追加してください）。
 * - className で中身や外側の追加スタイルを渡せます。
 *
 * 使い方例:
 * - ラッパーとして: <BorderStyle1><input className="bg-transparent w-full" /></BorderStyle1>
 * - クラス文字列を直接使いたい場合はここでエクスポートして再利用する設計も可能です。
 */
export function BorderStyle1({ children, className = '' }: Props) {
  return <div className={`${BORDER_STYLE_1} ${className}`.trim()}>{children}</div>;
}

/**
 * 既存コード互換のため default export も残す
 */
export default Panel;
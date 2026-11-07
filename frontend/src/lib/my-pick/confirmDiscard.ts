/** 未保存の変更を破棄してよいかをブラウザの確認ダイアログで尋ねる */
export const UNSAVED_MESSAGE =
  '保存されていない変更があります。破棄してもよろしいですか？';

export function confirmDiscard(): boolean {
  return window.confirm(UNSAVED_MESSAGE);
}

import { MAX_SHEET_NAME_LENGTH } from './constants';

export interface SheetNameResult {
  /** 前後の空白を除いた名前 */
  value: string;
  /** エラーメッセージ。問題なければ null */
  error: string | null;
}

/** 表の名前を検証する（前後の空白を除いて1〜50文字） */
export function validateSheetName(name: string): SheetNameResult {
  const value = name.trim();
  if (value.length === 0) {
    return { value, error: '表の名前を入力してください' };
  }
  if (value.length > MAX_SHEET_NAME_LENGTH) {
    return {
      value,
      error: `表の名前は${MAX_SHEET_NAME_LENGTH}文字以内で入力してください`,
    };
  }
  return { value, error: null };
}

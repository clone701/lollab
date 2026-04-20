/**
 * サモナー名のバリデーション結果
 * - null: バリデーション通過（検索実行可能）
 * - string: エラーメッセージ
 * - false: 検索を実行しない（空入力）
 */
export type ValidationResult = null | string | false;

/**
 * サモナー名をバリデーションする純粋関数
 * タグライン（#タグ）はオプション。名前のみでも検索可能。
 * @param value 入力値
 * @returns null（成功）、false（空入力）、またはエラーメッセージ文字列
 */
export function validateSummonerName(value: string): ValidationResult {
  // 空入力・空白のみ: 検索を実行しない
  if (value.trim() === '') {
    return false;
  }

  // 101文字以上: エラー
  if (value.length >= 101) {
    return '入力が長すぎます';
  }

  return null;
}

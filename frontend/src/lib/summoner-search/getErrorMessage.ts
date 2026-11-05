// 例外からユーザー向けのエラーメッセージを取り出す
export function getErrorMessage(e: unknown): string {
  return e instanceof Error ? e.message : '予期しないエラーが発生しました';
}

/** 保存の途中で失敗したとき、詳細はログだけに出して一般的なメッセージで例外を投げる */
export function failSave(message: string, cause: unknown): never {
  console.error(message, cause);
  throw new Error('マイピック表の保存に失敗しました');
}

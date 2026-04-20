// タイトルバリデーション: 空または100文字超でエラー、有効ならnull
export function validateTitle(title: string): string | null {
  if (title.length === 0) {
    return 'タイトルを入力してください';
  }
  if (title.length > 100) {
    return 'タイトルは100文字以内で入力してください';
  }
  return null;
}

// 本文バリデーション: 10,000文字超でエラー、有効ならnull
export function validateBody(body: string): string | null {
  if (body.length > 10000) {
    return '本文は10,000文字以内で入力してください';
  }
  return null;
}

// タグバリデーション: 20文字超でエラー、有効ならnull
export function validateTag(tag: string): string | null {
  if (tag.length > 20) {
    return 'タグは20文字以内で入力してください';
  }
  return null;
}

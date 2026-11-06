/** API が 401（未認証）または 403（利用不可のアカウント）を返したときのエラー */
export class ApiAuthError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiAuthError';
    this.status = status;
  }
}

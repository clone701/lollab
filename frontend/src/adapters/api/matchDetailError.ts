export const MATCH_DETAIL_RATE_LIMIT_MESSAGE =
  'しばらくしてから再試行してください';
export const MATCH_DETAIL_FAILED_MESSAGE = '試合詳細を取得できませんでした';

/** HTTP ステータスから、画面に出す試合詳細のエラーメッセージを決める */
export function toMatchDetailErrorMessage(status: number): string {
  // 429 は Riot API のレート制限。ほかは 404・422・502 などを区別せず同じ文言にする
  return status === 429
    ? MATCH_DETAIL_RATE_LIMIT_MESSAGE
    : MATCH_DETAIL_FAILED_MESSAGE;
}

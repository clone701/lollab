const CALLBACK_PATH = '/auth/callback';

/** ログイン後のコールバック画面か（trailingSlash の有無を問わない） */
export function isAuthCallbackPath(pathname: string | null): boolean {
  if (pathname === null) return false;
  return pathname === CALLBACK_PATH || pathname.startsWith(`${CALLBACK_PATH}/`);
}

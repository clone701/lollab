import { assertNotAuthError } from './assertNotAuthError';
import { buildApiHeaders } from './buildApiHeaders';

/**
 * バックエンド API を呼ぶ。fetch と同じく Response を返す。
 * 呼び出し先は NEXT_PUBLIC_BACKEND_URL（未設定なら同じオリジン）。
 *
 * @throws ApiAuthError 401・403 のとき
 */
export async function apiFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? '';
  const headers = await buildApiHeaders(init);
  const res = await fetch(`${baseUrl}${path}`, { ...init, headers });
  await assertNotAuthError(res);
  return res;
}

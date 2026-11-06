import { getAccessToken } from './getAccessToken';
import { sha256Hex } from './sha256Hex';
import { toBodyBytes } from './toBodyBytes';

const BODYLESS_METHODS = ['GET', 'HEAD'];

/**
 * API 呼び出しのヘッダーを作る。
 * - X-Lollab-Auth: ログイン中なら Supabase のアクセストークン
 *   （Authorization は CloudFront のベーシック認証と OAC 署名が使うため付けない）
 * - x-amz-content-sha256: GET・HEAD 以外は本文（なければ空文字）の SHA-256
 *   （Lambda 関数 URL の OAC が署名に使う）
 */
export async function buildApiHeaders(init?: RequestInit): Promise<Headers> {
  const headers = new Headers(init?.headers);
  const token = await getAccessToken();
  if (token) headers.set('X-Lollab-Auth', `Bearer ${token}`);

  const method = (init?.method ?? 'GET').toUpperCase();
  if (!BODYLESS_METHODS.includes(method)) {
    const bytes = await toBodyBytes(init?.body);
    headers.set('x-amz-content-sha256', await sha256Hex(bytes));
  }
  return headers;
}

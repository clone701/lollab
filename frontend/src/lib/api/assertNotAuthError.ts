import { ApiAuthError } from './ApiAuthError';
import { notifyForbidden } from './notifyForbidden';

/**
 * 401・403 の応答なら ApiAuthError を投げる。403 は AuthGate にも通知する。
 * メッセージは API の detail を使い、なければ「APIエラー: {status}」。
 */
export async function assertNotAuthError(res: Response): Promise<void> {
  if (res.status !== 401 && res.status !== 403) return;
  const body: unknown = await res.json().catch(() => null);
  const detail = (body as { detail?: unknown } | null)?.detail;
  const message =
    typeof detail === 'string' && detail !== ''
      ? detail
      : `APIエラー: ${res.status}`;
  if (res.status === 403) notifyForbidden();
  throw new ApiAuthError(res.status, message);
}

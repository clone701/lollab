import { FORBIDDEN_EVENT } from './forbiddenEvent';

/** 403 の通知を購読する。戻り値は購読解除の関数 */
export function subscribeForbidden(listener: () => void): () => void {
  window.addEventListener(FORBIDDEN_EVENT, listener);
  return () => window.removeEventListener(FORBIDDEN_EVENT, listener);
}

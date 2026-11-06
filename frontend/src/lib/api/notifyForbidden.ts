import { FORBIDDEN_EVENT } from './forbiddenEvent';

/** 403 を受けたことを通知する（ブラウザ以外では何もしない） */
export function notifyForbidden(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(FORBIDDEN_EVENT));
}

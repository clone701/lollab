/**
 * 直近選択したチャンピオンIDの localStorage ストア
 *
 * useSyncExternalStore から利用する。スナップショットは localStorage の
 * 生文字列（プリミティブ）なので、変更が無ければ同一値として扱われる。
 */

const STORAGE_KEY = 'lollab_recent_champions';

export const MAX_RECENT_CHAMPIONS = 10;

const listeners = new Set<() => void>();

/** クライアント側のスナップショット（localStorage の生文字列） */
export function getSnapshot(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? '';
  } catch (error) {
    console.error('Failed to load recent champions:', error);
    return '';
  }
}

/** サーバー側・ハイドレーション中のスナップショット（履歴なし） */
export function getServerSnapshot(): string {
  return '';
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** 生文字列をチャンピオンID配列に変換（不正な値は空配列） */
export function parseRecentChampionIds(raw: string): string[] {
  if (!raw) return [];
  try {
    const ids: unknown = JSON.parse(raw);
    return Array.isArray(ids) ? ids : [];
  } catch (error) {
    console.error('Failed to load recent champions:', error);
    return [];
  }
}

/** チャンピオンID配列を保存し、購読者に変更を通知する */
export function saveRecentChampionIds(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch (error) {
    console.error('Failed to save recent champions:', error);
  }
  listeners.forEach((listener) => listener());
}

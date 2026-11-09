const cache = new Map<string, Promise<unknown>>();

/**
 * URL の JSON を取得する。同じ URL の2回目以降は同じ Promise を返す。
 * 失敗したら保持を消し、次の呼び出しで再び取得する
 */
export function loadOnce<T>(url: string): Promise<T> {
  const cached = cache.get(url);
  if (cached) return cached as Promise<T>;
  const promise = fetch(url)
    .then((res) => {
      if (!res.ok)
        throw new Error(`ゲームデータの取得に失敗しました: ${res.status}`);
      return res.json() as Promise<T>;
    })
    .catch((e: unknown) => {
      cache.delete(url);
      throw e;
    });
  cache.set(url, promise);
  return promise;
}

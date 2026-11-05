// ISO 8601 文字列から現在までの経過秒数を返す（不正な日時・未来の日時は 0）
export function secondsSince(
  isoString: string,
  now: number = Date.now()
): number {
  const elapsedMs = now - new Date(isoString).getTime();
  return Number.isFinite(elapsedMs)
    ? Math.max(0, Math.floor(elapsedMs / 1000))
    : 0;
}

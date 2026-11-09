/** 自身のキーだけを引く（`constructor` などの継承プロパティを拾わない） */
export function getOwn<T>(
  record: Record<string, T>,
  key: string
): T | undefined {
  return Object.prototype.hasOwnProperty.call(record, key)
    ? record[key]
    : undefined;
}

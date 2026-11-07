/** 枠 index のピックを外し、右の枠を詰める（新しい配列を返す） */
export function removePickAt(picks: string[], index: number): string[] {
  if (index < 0 || index >= picks.length) return picks;
  return picks.filter((_, i) => i !== index);
}

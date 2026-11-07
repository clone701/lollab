import type { PickLane, PickSheet } from '@/types/myPick';

/** レーンで一覧を絞り込む。lane が null なら全て返す */
export function filterSheetsByLane(
  sheets: PickSheet[],
  lane: PickLane | null
): PickSheet[] {
  if (lane === null) return sheets;
  return sheets.filter((s) => s.lane === lane);
}

import { MAX_PICKS } from './constants';

/** 「＋」を押した後の枠の数（上限10） */
export function addSlot(slotCount: number): number {
  return Math.min(MAX_PICKS, slotCount + 1);
}

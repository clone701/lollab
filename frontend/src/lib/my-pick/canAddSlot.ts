import { MAX_PICKS } from './constants';

/** 「＋」を押せるか（枠が10に達していない） */
export function canAddSlot(slotCount: number): boolean {
  return slotCount < MAX_PICKS;
}

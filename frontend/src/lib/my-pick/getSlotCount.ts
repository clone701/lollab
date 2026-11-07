import { MAX_PICKS, MIN_SLOTS } from './constants';

/**
 * 行に表示する枠の数。ピック数・初期値3・「＋」で増やした数のうち最大のもの（上限10）。
 */
export function getSlotCount(pickCount: number, expandedCount = 0): number {
  return Math.min(MAX_PICKS, Math.max(pickCount, MIN_SLOTS, expandedCount));
}

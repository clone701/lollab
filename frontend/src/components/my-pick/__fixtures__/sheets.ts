import type { PickSheet, PickSheetDetail } from '@/types/myPick';

export function makeSheet(overrides: Partial<PickSheet> = {}): PickSheet {
  return {
    id: 1,
    name: 'TOP表',
    lane: 'TOP',
    entryCount: 2,
    createdAt: '2026-11-01T00:00:00Z',
    updatedAt: '2026-11-07T10:30:00Z',
    ...overrides,
  };
}

/** Ahri には Zed → Yasuo の順、Zed には Ahri（ミラーではない）のピックがある表 */
export function makeDetail(
  overrides: Partial<PickSheetDetail> = {}
): PickSheetDetail {
  return {
    ...makeSheet(),
    rows: [
      { enemyChampionId: 'Ahri', pickChampionIds: ['Zed', 'Yasuo'] },
      { enemyChampionId: 'Zed', pickChampionIds: ['Ahri'] },
    ],
    ...overrides,
  };
}

'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  EMPTY_PICKS,
  addSlot,
  removePickAt,
  serializeDraft,
  setPickAt,
  toPickMap,
  toPickRows,
} from '@/lib/my-pick';
import type { PickLane, PickSheetDetail } from '@/types/myPick';

// 編集中の内容（名前・レーン・相手ごとのピック・増やした枠の数）と、未保存の変更の有無
export function usePickEditor(sheet: PickSheetDetail) {
  const [name, setName] = useState(sheet.name);
  const [lane, setLane] = useState<PickLane>(sheet.lane);
  const [picks, setPicks] = useState(() => toPickMap(sheet.rows));
  const [expanded, setExpanded] = useState<Record<string, number>>({});
  const [initialDraft] = useState(() =>
    serializeDraft(sheet.name, sheet.lane, toPickMap(sheet.rows))
  );

  const isDirty = useMemo(
    () => serializeDraft(name, lane, picks) !== initialDraft,
    [name, lane, picks, initialDraft]
  );
  const rows = useMemo(() => toPickRows(picks), [picks]);

  // 行ごとの更新は、他の行の配列の参照を変えない（memo の行を再描画させないため）
  const handleSetPick = useCallback(
    (enemyId: string, index: number, championId: string) =>
      setPicks((prev) => {
        const current = prev[enemyId] ?? EMPTY_PICKS;
        const next = setPickAt(current, index, championId);
        return next === current ? prev : { ...prev, [enemyId]: next };
      }),
    []
  );

  const handleRemovePick = useCallback(
    (enemyId: string, index: number) =>
      setPicks((prev) => {
        const next = removePickAt(prev[enemyId] ?? EMPTY_PICKS, index);
        if (next === prev[enemyId] || !prev[enemyId]) return prev;
        const { [enemyId]: _removed, ...others } = prev;
        return next.length === 0 ? others : { ...others, [enemyId]: next };
      }),
    []
  );

  const handleAddSlot = useCallback(
    (enemyId: string, slotCount: number) =>
      setExpanded((prev) => ({ ...prev, [enemyId]: addSlot(slotCount) })),
    []
  );

  return {
    name,
    lane,
    picks,
    expanded,
    rows,
    isDirty,
    setName,
    setLane,
    handleSetPick,
    handleRemovePick,
    handleAddSlot,
  };
}

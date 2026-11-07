'use client';

import { useCallback, useState } from 'react';
import { getChampionById } from '@/lib/data/champions';
import { EMPTY_PICKS } from '@/lib/my-pick';
import type { Champion } from '@/types/champion';
import { ChampionPickerDialog } from './ChampionPickerDialog';
import { PickEditRows } from './PickEditRows';

interface PickEditListProps {
  /** 表示する相手（絞り込み後） */
  enemies: Champion[];
  picks: Record<string, string[]>;
  expanded: Record<string, number>;
  onSetPick: (enemyId: string, index: number, championId: string) => void;
  onRemovePick: (enemyId: string, index: number) => void;
  onAddSlot: (enemyId: string, slotCount: number) => void;
}

interface Target {
  enemyId: string;
  index: number;
}

// 編集画面の行の一覧と、枠を押したときに開くチャンピオン選択
export function PickEditList({ onSetPick, ...rest }: PickEditListProps) {
  const [target, setTarget] = useState<Target | null>(null);
  const handleOpenPicker = useCallback(
    (enemyId: string, index: number) => setTarget({ enemyId, index }),
    []
  );
  const targetEnemy = target ? getChampionById(target.enemyId) : null;

  if (rest.enemies.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-fg-muted">
        該当する相手チャンピオンがありません
      </p>
    );
  }
  return (
    <>
      <PickEditRows {...rest} onOpenPicker={handleOpenPicker} />
      {target && targetEnemy && (
        <ChampionPickerDialog
          title={`${targetEnemy.name} へのピックを選ぶ`}
          disabledIds={(rest.picks[target.enemyId] ?? EMPTY_PICKS).filter(
            (_, i) => i !== target.index
          )}
          onSelect={(championId) => {
            onSetPick(target.enemyId, target.index, championId);
            setTarget(null);
          }}
          onClose={() => setTarget(null)}
        />
      )}
    </>
  );
}

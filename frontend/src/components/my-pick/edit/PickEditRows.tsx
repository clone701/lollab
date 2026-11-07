import { EMPTY_PICKS, getSlotCount } from '@/lib/my-pick';
import type { Champion } from '@/types/champion';
import { PickEditRow } from './PickEditRow';

interface PickEditRowsProps {
  enemies: Champion[];
  picks: Record<string, string[]>;
  /** 「＋」で増やした枠の数 */
  expanded: Record<string, number>;
  onOpenPicker: (enemyId: string, index: number) => void;
  onRemovePick: (enemyId: string, index: number) => void;
  onAddSlot: (enemyId: string, slotCount: number) => void;
}

// 編集画面の行の並び
export function PickEditRows(p: PickEditRowsProps) {
  return (
    <ul>
      {p.enemies.map((enemy) => {
        const picks = p.picks[enemy.id] ?? EMPTY_PICKS;
        return (
          <PickEditRow
            key={enemy.id}
            enemy={enemy}
            picks={picks}
            slotCount={getSlotCount(picks.length, p.expanded[enemy.id])}
            onOpenPicker={p.onOpenPicker}
            onRemovePick={p.onRemovePick}
            onAddSlot={p.onAddSlot}
          />
        );
      })}
    </ul>
  );
}

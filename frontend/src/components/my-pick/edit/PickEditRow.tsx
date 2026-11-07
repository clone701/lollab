import { memo } from 'react';
import type { Champion } from '@/types/champion';
import { EnemyLabel } from '../EnemyLabel';
import { AddSlotButton } from './AddSlotButton';
import { PickSlot } from './PickSlot';

interface PickEditRowProps {
  enemy: Champion;
  picks: string[];
  slotCount: number;
  onOpenPicker: (enemyId: string, index: number) => void;
  onRemovePick: (enemyId: string, index: number) => void;
  onAddSlot: (enemyId: string, slotCount: number) => void;
}

// 編集画面の1行。相手 + ピックの枠 + 「＋」。約170行並ぶため memo にする
function PickEditRowBase(p: PickEditRowProps) {
  const indexes = Array.from({ length: p.slotCount }, (_, i) => i);
  return (
    <li className="flex items-center gap-3 border-b border-line py-2">
      <EnemyLabel enemy={p.enemy} />
      <ul className="flex flex-wrap items-center gap-2">
        {indexes.map((i) => (
          <li key={i}>
            <PickSlot
              enemy={p.enemy}
              index={i}
              pickId={p.picks[i] ?? null}
              onOpen={p.onOpenPicker}
              onRemove={p.onRemovePick}
            />
          </li>
        ))}
        <li>
          <AddSlotButton
            enemyName={p.enemy.name}
            slotCount={p.slotCount}
            onClick={() => p.onAddSlot(p.enemy.id, p.slotCount)}
          />
        </li>
      </ul>
    </li>
  );
}

export const PickEditRow = memo(PickEditRowBase);

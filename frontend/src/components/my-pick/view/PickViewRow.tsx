import { memo } from 'react';
import { getChampionById } from '@/lib/data/champions';
import type { Champion } from '@/types/champion';
import { EnemyLabel } from '../EnemyLabel';
import { PickLink } from './PickLink';

interface PickViewRowProps {
  enemy: Champion;
  /** 自分のピックの id（順番どおり） */
  pickIds: string[];
}

// 閲覧画面の1行。相手のアイコン・名前と、ピックのアイコン（順番どおり）
function PickViewRowBase({ enemy, pickIds }: PickViewRowProps) {
  return (
    <li className="flex items-center gap-3 border-b border-line py-2">
      <EnemyLabel enemy={enemy} />
      <ul className="flex flex-wrap items-center gap-2">
        {pickIds.map((id) => {
          const pick = getChampionById(id);
          return pick ? (
            <li key={id}>
              <PickLink pick={pick} enemy={enemy} />
            </li>
          ) : null;
        })}
      </ul>
    </li>
  );
}

export const PickViewRow = memo(PickViewRowBase);

import React from 'react';
import Image from 'next/image';
import { itemBtnClass } from '@/components/ui/Panel';

export type SummonerSpell = {
  id: string;
  name: string;
  icon: string;
  // 追加情報があればここに
};

type Props = {
  spells: SummonerSpell[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  readOnly?: boolean;
};

export default function SummonerSpellPicker({ spells, selectedIds, onToggle, readOnly = false }: Props) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
      {spells.map(s => {
        const active = selectedIds.includes(s.id);
        // 非選択のときに選択上限(2)に達していれば追加不可として見た目を無効化
        const disabled = readOnly || (!active && selectedIds.length >= 2);

        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onToggle(s.id)}
            disabled={disabled}
            aria-pressed={active}
            className={itemBtnClass({ active, disabled })}
          >
            <Image src={s.icon} alt={s.name} width={44} height={44} />
            <div className={`text-xs text-center ${active ? 'text-pink-700' : ''}`}>{s.name}</div>
          </button>
        );
      })}
    </div>
  );
}
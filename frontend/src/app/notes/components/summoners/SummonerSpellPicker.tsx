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
  mode?: 'create' | 'display'; // ← 追加: 表示モード or 作成モード
};

export default function SummonerSpellPicker({
  spells,
  selectedIds,
  onToggle,
  readOnly = false,
  mode = 'create',
}: Props) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
      {spells.map(s => {
        const active = selectedIds.includes(s.id);
        // 非選択のときに選択上限(2)に達していれば追加不可（見た目で無効化）
        const limitDisabled = !active && selectedIds.length >= 2;
        // 操作自体は readOnly または limitDisabled で無効化するが、
        // 見た目の無効化（opacity）は limitDisabled のみで行う
        const interactionDisabled = readOnly || limitDisabled;
        const styleDisabled = limitDisabled;

        // display モードでは、選択されていないサモナースペルは枠ごと非表示にする
        if (mode === 'display' && !active) return null;

        // display/create 両方で表示するものは通常レンダリング
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => !interactionDisabled && onToggle(s.id)}
            disabled={interactionDisabled}
            aria-pressed={active}
            className={itemBtnClass({ active, disabled: styleDisabled })}
          >
            <Image src={s.icon} alt={s.name} width={44} height={44} />
            <div className={`text-xs text-center ${active ? 'text-pink-700' : ''}`}>{s.name}</div>
          </button>
        );
      })}
    </div>
  );
}
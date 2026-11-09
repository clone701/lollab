'use client';

import { useMemo, useState } from 'react';
import { filterChampions } from '@/lib/champion-build';
import { CHAMPIONS_BY_READING } from '@/lib/champion-order';
import { ChampionSearchInput } from '../ChampionSearchInput';
import { ModalFrame } from '../ModalFrame';
import { PickerChampionButton } from './PickerChampionButton';

interface ChampionPickerDialogProps {
  title: string;
  /** 選べないチャンピオンの id（同じ行に既にあるピック） */
  disabledIds: string[];
  onSelect: (championId: string) => void;
  onClose: () => void;
}

// 検索付きのチャンピオン選択。Esc キーで閉じる
export function ChampionPickerDialog(p: ChampionPickerDialogProps) {
  const [query, setQuery] = useState('');
  const list = useMemo(
    () => filterChampions(CHAMPIONS_BY_READING, query),
    [query]
  );

  return (
    <ModalFrame
      titleId="champion-picker-title"
      onClose={p.onClose}
      widthClass="max-w-2xl"
    >
      <h2
        id="champion-picker-title"
        className="mb-3 text-base font-bold text-fg"
      >
        {p.title}
      </h2>
      <ChampionSearchInput
        value={query}
        onChange={setQuery}
        label="チャンピオンを検索"
        autoFocus
      />
      {list.length === 0 ? (
        <p className="py-6 text-center text-sm text-fg-muted">
          該当するチャンピオンがありません
        </p>
      ) : (
        <ul className="mt-3 grid max-h-96 grid-cols-4 gap-1 overflow-y-auto sm:grid-cols-6 md:grid-cols-8">
          {list.map((champion) => (
            <li key={champion.id}>
              <PickerChampionButton
                champion={champion}
                isDisabled={p.disabledIds.includes(champion.id)}
                onSelect={p.onSelect}
              />
            </li>
          ))}
        </ul>
      )}
    </ModalFrame>
  );
}

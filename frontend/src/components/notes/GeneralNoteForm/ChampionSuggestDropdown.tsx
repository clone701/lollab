'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { Champion } from '@/types/champion';

interface ChampionSuggestDropdownProps {
  candidates: Champion[];
  focusedIndex: number;
  onSelect: (champion: Champion) => void;
  onClose: () => void;
}

export function ChampionSuggestDropdown({
  candidates,
  focusedIndex,
  onSelect,
  onClose,
}: ChampionSuggestDropdownProps) {
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // フォーカスされた候補をスクロール表示
  useEffect(() => {
    if (focusedIndex >= 0 && itemRefs.current[focusedIndex]) {
      itemRefs.current[focusedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [focusedIndex]);

  return (
    <div
      className="absolute z-50 bg-surface border border-line rounded shadow-md w-52 max-h-60 overflow-y-auto"
      onMouseDown={(e) => e.preventDefault()} // textareaのblurを防ぐ
    >
      {candidates.map((champion, index) => (
        <button
          key={champion.id}
          ref={(el) => {
            itemRefs.current[index] = el;
          }}
          type="button"
          onClick={() => onSelect(champion)}
          className={`flex items-center gap-2 w-full px-3 py-1.5 text-sm text-left hover:bg-surface-2 transition-colors duration-150 ${
            index === focusedIndex
              ? 'bg-accent/15 ring-2 ring-accent ring-inset'
              : ''
          }`}
        >
          <Image
            src={champion.imagePath}
            alt={champion.name}
            width={24}
            height={24}
            className="rounded-full shrink-0"
          />
          <span className="text-fg">{champion.name}</span>
          <span className="text-fg-subtle text-xs ml-auto">{champion.id}</span>
        </button>
      ))}
      <button
        type="button"
        onClick={onClose}
        className="w-full px-3 py-1 text-xs text-fg-subtle hover:bg-surface-2 border-t border-line"
      >
        閉じる (Esc)
      </button>
    </div>
  );
}

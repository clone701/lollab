'use client';

import Image from 'next/image';
import { Champion } from '@/types/champion';

interface ChampionSuggestDropdownProps {
  candidates: Champion[];
  onSelect: (champion: Champion) => void;
  onClose: () => void;
}

export function ChampionSuggestDropdown({
  candidates,
  onSelect,
  onClose,
}: ChampionSuggestDropdownProps) {
  return (
    <div
      className="absolute z-50 bg-white border border-gray-200 rounded shadow-md w-52 max-h-60 overflow-y-auto"
      onMouseDown={(e) => e.preventDefault()} // textareaのblurを防ぐ
    >
      {candidates.map((champion) => (
        <button
          key={champion.id}
          type="button"
          onClick={() => onSelect(champion)}
          className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-left hover:bg-gray-100 transition-colors duration-150"
        >
          <Image
            src={champion.imagePath}
            alt={champion.name}
            width={24}
            height={24}
            className="rounded-full shrink-0"
          />
          <span className="text-gray-800">{champion.name}</span>
          <span className="text-gray-400 text-xs ml-auto">{champion.id}</span>
        </button>
      ))}
      <button
        type="button"
        onClick={onClose}
        className="w-full px-3 py-1 text-xs text-gray-400 hover:bg-gray-50 border-t border-gray-100"
      >
        閉じる (Esc)
      </button>
    </div>
  );
}

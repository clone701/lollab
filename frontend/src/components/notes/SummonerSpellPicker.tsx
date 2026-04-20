'use client';

import { memo } from 'react';
import { SUMMONER_SPELLS } from '@/lib/data/summonerSpells';

interface SummonerSpellPickerProps {
  value: string[];
  onChange: (spells: string[]) => void;
  disabled?: boolean;
}

function SummonerSpellPicker({
  value,
  onChange,
  disabled = false,
}: SummonerSpellPickerProps) {
  const handleSpellClick = (spellId: string) => {
    if (value.includes(spellId)) {
      onChange(value.filter((id) => id !== spellId));
    } else if (value.length < 2) {
      onChange([...value, spellId]);
    } else {
      onChange([value[1], spellId]);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
      {SUMMONER_SPELLS.map((spell) => (
        <button
          key={spell.id}
          type="button"
          onClick={() => handleSpellClick(spell.id)}
          disabled={disabled}
          className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            value.includes(spell.id)
              ? 'ring-2 ring-blue-500 shadow-md shadow-blue-500/20 bg-blue-50'
              : disabled
                ? 'opacity-50 cursor-not-allowed bg-white'
                : 'hover:ring-2 hover:ring-gray-300 bg-white'
          }`}
          aria-label={`サモナースペル: ${spell.name}`}
          aria-pressed={value.includes(spell.id)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={spell.icon}
            alt={spell.name}
            className="w-12 h-12"
            width={48}
            height={48}
            loading="lazy"
          />
          <span className="text-xs text-gray-600 mt-1">{spell.name}</span>
        </button>
      ))}
    </div>
  );
}

export default memo(SummonerSpellPicker);

'use client';

import { memo } from 'react';
import { SUMMONER_SPELLS } from '@/lib/data/summonerSpells';

interface SummonerSpellPickerProps {
    value: string[];
    onChange: (spells: string[]) => void;
    disabled?: boolean;
}

/**
 * SummonerSpellPicker - サモナースペル選択UIコンポーネント
 * 
 * 縦並びレイアウトで英語名を表示（コンパクト版）
 */
function SummonerSpellPicker({ value, onChange, disabled = false }: SummonerSpellPickerProps) {
    const handleSpellClick = (spellId: string) => {
        if (value.includes(spellId)) {
            // 既に選択されている場合は解除
            onChange(value.filter(id => id !== spellId));
        } else if (value.length < 2) {
            // 2つ未満の場合は追加
            onChange([...value, spellId]);
        } else {
            // 2つ選択済みの場合は最初のスペルを置き換え
            onChange([value[1], spellId]);
        }
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {SUMMONER_SPELLS.map((spell) => (
                <button
                    key={spell.id}
                    onClick={() => handleSpellClick(spell.id)}
                    disabled={disabled}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 ${value.includes(spell.id)
                        ? 'ring-2 ring-blue-500 shadow-md shadow-blue-500/20 bg-blue-50'
                        : disabled
                            ? 'opacity-50 cursor-not-allowed bg-white'
                            : 'hover:ring-2 hover:ring-gray-300 bg-white'
                        }`}
                    aria-label={`サモナースペル: ${spell.name}`}
                    aria-pressed={value.includes(spell.id)}
                    aria-disabled={disabled}
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

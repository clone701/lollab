'use client';

import { SpellTooltipContent } from '@/components/game-data';
import { Tooltip } from '@/components/ui/tooltip';
import type { SummonerSpell } from '@/lib/data/summonerSpells';

// 閲覧モードのサモナースペル。マウスを乗せると名前・クールダウン・説明を出す
export function ViewSpellIcon({ spell }: { spell: SummonerSpell }) {
  return (
    <Tooltip
      trigger={
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={spell.icon}
          alt={spell.name}
          width={40}
          height={40}
          className="w-10 h-10 rounded"
        />
      }
      content={
        <SpellTooltipContent
          id={spell.id}
          label={spell.name}
          iconSrc={spell.icon}
        />
      }
    />
  );
}

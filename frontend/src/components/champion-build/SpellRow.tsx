import { SpellTooltipIcon } from '@/components/game-data';
import { calcPickShare, getSpellIcon } from '@/lib/champion-build';
import type { BuildOption } from '@/types/championBuild';
import { OptionStat } from './OptionStat';
import { PickShareBar } from './PickShareBar';

interface SpellRowProps {
  option: BuildOption;
  /** 採用率の分母（スペル要素の集計対象の試合数） */
  elementGames: number;
  /** 1件目の行は背景を付けて目立たせる */
  isFirst: boolean;
}

// サモナースペル1組分の行。アイコン・勝率・試合数・採用率
export function SpellRow({ option, elementGames, isFirst }: SpellRowProps) {
  return (
    <li
      className={`flex flex-wrap items-center gap-3 rounded-lg p-2 ${isFirst ? 'bg-surface-2' : ''}`}
    >
      <div className="flex gap-1">
        {option.key.map((id) => {
          const icon = getSpellIcon(id);
          return (
            <SpellTooltipIcon
              id={id}
              key={id}
              src={icon?.src ?? null}
              label={icon?.name ?? `スペル${id}`}
              size={40}
            />
          );
        })}
      </div>
      <OptionStat option={option} />
      <PickShareBar share={calcPickShare(option.games, elementGames)} />
    </li>
  );
}

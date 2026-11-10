import type { BuildElement } from '@/types/championBuild';
import { NoData } from './NoData';
import { PanelSection } from './PanelSection';
import { SpellRow } from './SpellRow';

interface SpellPanelProps {
  spells: BuildElement;
}

// 試合数の多い上位2件を行で並べる
export function SpellPanel({ spells }: SpellPanelProps) {
  const rows = spells.options.slice(0, 2);
  return (
    <PanelSection title="サモナースペル">
      {rows.length === 0 ? (
        <NoData />
      ) : (
        <ul className="flex flex-col gap-1">
          {rows.map((option, index) => (
            <SpellRow
              key={option.key.join('-')}
              option={option}
              elementGames={spells.games}
              isFirst={index === 0}
            />
          ))}
        </ul>
      )}
    </PanelSection>
  );
}

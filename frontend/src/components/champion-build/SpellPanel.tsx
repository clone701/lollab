import { getSpellIcon, selectOption } from '@/lib/champion-build';
import type { BuildElement, BuildMode } from '@/types/championBuild';
import { BuildIcon } from './BuildIcon';
import { NoData } from './NoData';
import { OptionStat } from './OptionStat';
import { PanelSection } from './PanelSection';

interface SpellPanelProps {
  spells: BuildElement;
  mode: BuildMode;
}

export function SpellPanel({ spells, mode }: SpellPanelProps) {
  const option = selectOption(spells, mode);
  return (
    <PanelSection title="サモナースペル">
      {option ? (
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {option.key.map((id) => {
              const icon = getSpellIcon(id);
              return (
                <BuildIcon
                  key={id}
                  src={icon?.src ?? null}
                  label={icon?.name ?? `スペル${id}`}
                  size={40}
                />
              );
            })}
          </div>
          <OptionStat option={option} />
        </div>
      ) : (
        <NoData />
      )}
    </PanelSection>
  );
}

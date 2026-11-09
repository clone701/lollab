import { RuneTooltipIcon } from '@/components/game-data';
import type { Rune } from '@/lib/data/runes';

interface RuneCellProps {
  rune: Rune;
  /** 選んだルーンは不透明、ほかは薄く表示する */
  isSelected: boolean;
}

export function RuneCell({ rune, isSelected }: RuneCellProps) {
  return (
    <span
      data-selected={isSelected}
      className={isSelected ? 'opacity-100' : 'opacity-30'}
    >
      <RuneTooltipIcon
        id={rune.id}
        src={rune.icon}
        label={rune.name}
        size={36}
        className="rounded-full"
      />
    </span>
  );
}

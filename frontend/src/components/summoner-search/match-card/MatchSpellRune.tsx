import { RuneTooltipIcon, SpellTooltipIcon } from '@/components/game-data';
import { getRuneIcon, getSpellIcon } from '@/lib/champion-build';

interface MatchSpellRuneProps {
  spellIds: number[];
  keystoneId: number;
  subStyleId: number;
}

// サモナースペル2つ（左・縦）と、キーストーン・サブツリー（右・縦）
export function MatchSpellRune({
  spellIds,
  keystoneId,
  subStyleId,
}: MatchSpellRuneProps) {
  const spells = spellIds.map((id) => ({ id, icon: getSpellIcon(id) }));
  const runes = [keystoneId, subStyleId].map((id) => ({
    id,
    icon: getRuneIcon(id),
  }));
  return (
    <div className="flex gap-0.5">
      <div className="flex flex-col gap-0.5">
        {spells.map(({ id, icon }, slot) => (
          <SpellTooltipIcon
            id={id}
            key={slot}
            src={icon?.src ?? null}
            label={icon?.name ?? `スペル${id}`}
            size={23}
          />
        ))}
      </div>
      <div className="flex flex-col gap-0.5">
        {runes.map(({ id, icon }) => (
          <RuneTooltipIcon
            id={id}
            key={id}
            src={icon?.src ?? null}
            label={icon?.name ?? `ルーン${id}`}
            size={23}
            className="rounded-full bg-canvas"
          />
        ))}
      </div>
    </div>
  );
}

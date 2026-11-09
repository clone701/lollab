import { RuneTooltipIcon, SpellTooltipIcon } from '@/components/game-data';
import { getRuneIcon, getSpellIcon } from '@/lib/champion-build';
import type { ParticipantDetail } from '@/types/matchDetail';

interface SpellRuneCellProps {
  participant: ParticipantDetail;
}

// サモナースペル2つ（左）と、メインのキーストーン・サブのツリー（右）
export function SpellRuneCell({ participant: p }: SpellRuneCellProps) {
  const spells = p.spell_ids.map((id) => ({ id, icon: getSpellIcon(id) }));
  const runes = [p.primary_perk_ids[0], p.sub_style_id]
    .filter((id): id is number => id !== undefined)
    .map((id) => ({ id, icon: getRuneIcon(id) }));
  return (
    <div className="flex gap-0.5">
      <div className="flex flex-col gap-0.5">
        {spells.map(({ id, icon }) => (
          <SpellTooltipIcon
            id={id}
            key={id}
            src={icon?.src ?? null}
            label={icon?.name ?? `スペル${id}`}
            size={16}
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
            size={16}
            className="rounded-full bg-canvas"
          />
        ))}
      </div>
    </div>
  );
}

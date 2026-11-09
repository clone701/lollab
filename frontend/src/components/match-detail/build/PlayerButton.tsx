import { BuildIcon } from '@/components/champion-build';
import { getChampionLabel } from '@/lib/champion-stats';
import { getDisplayName, toChampionId } from '@/lib/match-detail';
import type { ParticipantDetail } from '@/types/matchDetail';

interface PlayerButtonProps {
  participant: ParticipantDetail;
  isSelected: boolean;
  onSelect: (puuid: string) => void;
}

export function PlayerButton({
  participant: p,
  isSelected,
  onSelect,
}: PlayerButtonProps) {
  const label = getChampionLabel(p.champion_name);
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      aria-label={`${label}（${getDisplayName(p)}）`}
      onClick={() => onSelect(p.puuid)}
      className={`rounded-full p-0.5 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
        isSelected
          ? 'ring-2 ring-accent bg-accent/15'
          : 'hover:ring-2 hover:ring-accent/60'
      }`}
    >
      <BuildIcon
        src={`/images/champion/${toChampionId(p.champion_name)}.png`}
        label={label}
        size={36}
        className="rounded-full"
      />
    </button>
  );
}

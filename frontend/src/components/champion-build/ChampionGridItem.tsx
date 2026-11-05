import type { Champion } from '@/types/champion';
import { BuildIcon } from './BuildIcon';

interface ChampionGridItemProps {
  champion: Champion;
  onSelect: (championId: string) => void;
}

export function ChampionGridItem({
  champion,
  onSelect,
}: ChampionGridItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(champion.id)}
      className="flex w-full flex-col items-center gap-1 rounded-lg p-2 transition-colors duration-150 hover:ring-2 hover:ring-blue-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <BuildIcon
        src={champion.imagePath}
        label={champion.name}
        size={56}
        className="rounded-full"
      />
      <span className="w-full truncate text-center text-xs text-gray-600">
        {champion.name}
      </span>
    </button>
  );
}

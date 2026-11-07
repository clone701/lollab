import { BuildIcon } from '@/components/champion-build';
import type { Champion } from '@/types/champion';

interface PickerChampionButtonProps {
  champion: Champion;
  isDisabled: boolean;
  onSelect: (championId: string) => void;
}

// チャンピオン選択の1マス。同じ行にあるピックは押せない
export function PickerChampionButton({
  champion,
  isDisabled,
  onSelect,
}: PickerChampionButtonProps) {
  return (
    <button
      type="button"
      disabled={isDisabled}
      aria-label={champion.name}
      onClick={() => onSelect(champion.id)}
      className="flex w-full flex-col items-center gap-1 rounded-lg p-2 transition-colors duration-150 hover:ring-2 hover:ring-accent/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:ring-0"
    >
      <BuildIcon
        src={champion.imagePath}
        label={champion.name}
        size={40}
        className="rounded-full"
      />
      <span className="w-full truncate text-center text-xs text-fg-muted">
        {champion.name}
      </span>
    </button>
  );
}

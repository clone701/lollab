import { getChampionById } from '@/lib/data/champions';
import type { Champion } from '@/types/champion';
import { BuildIcon } from '@/components/champion-build';

interface PickSlotProps {
  enemy: Champion;
  /** 枠の番号（0 始まり） */
  index: number;
  /** 枠に入っているピックの id。空なら null */
  pickId: string | null;
  onOpen: (enemyId: string, index: number) => void;
  onRemove: (enemyId: string, index: number) => void;
}

// ピックの枠。押すとチャンピオンを選ぶ。入っているときは右上の「×」で外せる
export function PickSlot({
  enemy,
  index,
  pickId,
  onOpen,
  onRemove,
}: PickSlotProps) {
  const pick = pickId ? getChampionById(pickId) : null;
  const label = pick
    ? `${enemy.name}へのピック${index + 1}: ${pick.name}（変更）`
    : `${enemy.name}へのピック${index + 1}を選ぶ`;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onOpen(enemy.id, index)}
        aria-label={label}
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-dashed border-line-strong bg-surface-2 transition-colors duration-150 hover:ring-2 hover:ring-accent/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {pick && (
          <BuildIcon
            src={pick.imagePath}
            label={pick.name}
            size={40}
            className="rounded-full"
          />
        )}
      </button>
      {pick && (
        <button
          type="button"
          onClick={() => onRemove(enemy.id, index)}
          aria-label={`${pick.name}を外す`}
          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-surface text-xs text-fg-muted ring-1 ring-line-strong hover:text-danger-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          ×
        </button>
      )}
    </div>
  );
}

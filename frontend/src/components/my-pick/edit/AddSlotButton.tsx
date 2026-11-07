import { canAddSlot } from '@/lib/my-pick';

interface AddSlotButtonProps {
  enemyName: string;
  /** 現在の枠の数 */
  slotCount: number;
  onClick: () => void;
}

// 行の枠を1つ増やす「＋」。枠が10に達したら押せない
export function AddSlotButton({
  enemyName,
  slotCount,
  onClick,
}: AddSlotButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!canAddSlot(slotCount)}
      aria-label={`${enemyName}のピックの枠を増やす`}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-base text-fg-muted transition-colors duration-150 hover:ring-2 hover:ring-accent/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:ring-0"
    >
      ＋
    </button>
  );
}

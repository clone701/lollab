import { ItemTooltipIcon } from '@/components/game-data';
import { itemIconUrls } from '@/lib/champion-build';

interface MatchItemsProps {
  /** item0〜6（0 は空き） */
  itemIds: number[];
}

// 最終アイテム7枠。空きの枠も残して位置をそろえる
export function MatchItems({ itemIds }: MatchItemsProps) {
  return (
    <ul className="flex gap-0.5">
      {itemIds.slice(0, 7).map((id, slot) => (
        <li key={slot} className="h-6 w-6 rounded bg-surface-2">
          {id !== 0 && (
            <ItemTooltipIcon
              id={id}
              {...itemIconUrls(id)}
              label={`アイテム${id}`}
              size={24}
            />
          )}
        </li>
      ))}
    </ul>
  );
}

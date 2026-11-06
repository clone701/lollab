import { BuildIcon } from '@/components/champion-build';
import { itemIconUrls } from '@/lib/champion-build';
import type { ItemPurchaseGroup } from '@/types/matchDetail';

interface ItemGroupProps {
  group: ItemPurchaseGroup;
}

// 同じ分に購入したアイテムと、その下に購入した時刻（分）
export function ItemGroup({ group }: ItemGroupProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex gap-0.5">
        {group.item_ids.map((id, i) => (
          <BuildIcon
            key={`${id}-${i}`}
            {...itemIconUrls(id)}
            label={`アイテム${id}`}
            size={32}
          />
        ))}
      </div>
      <span className="text-xs text-fg-muted">{group.minute}分</span>
    </div>
  );
}

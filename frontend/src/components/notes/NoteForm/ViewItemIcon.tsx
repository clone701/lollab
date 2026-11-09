'use client';

import { ItemTooltipContent } from '@/components/game-data';
import { Tooltip } from '@/components/ui/tooltip';
import type { Item } from '@/lib/data/items';

interface ViewItemIconProps {
  item: Item;
  count: number;
}

// 閲覧モードの初期アイテム。同じアイテムが複数なら個数のバッジを付ける
export function ViewItemIcon({ item, count }: ViewItemIconProps) {
  return (
    <div className="relative">
      <Tooltip
        trigger={
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.icon}
            alt={item.name}
            width={40}
            height={40}
            className="w-10 h-10 rounded"
          />
        }
        content={
          <ItemTooltipContent
            id={Number(item.id)}
            label={item.name}
            iconSrc={item.icon}
          />
        }
      />
      {count > 1 && (
        <span className="absolute -top-1 -right-1 bg-action text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
          {count}
        </span>
      )}
    </div>
  );
}

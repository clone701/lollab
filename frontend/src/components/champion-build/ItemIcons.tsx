import { Fragment } from 'react';
import { itemIconUrls } from '@/lib/champion-build';
import { ItemTooltipIcon } from '@/components/game-data';

interface ItemIconsProps {
  ids: number[];
  /** アイテム間に挟む記号（例: "→"）。省略時は並べるだけ */
  separator?: string;
}

export function ItemIcons({ ids, separator }: ItemIconsProps) {
  return (
    <div className="flex items-center gap-1">
      {ids.map((id, index) => {
        const { src, fallbackSrc } = itemIconUrls(id);
        return (
          <Fragment key={`${id}-${index}`}>
            {separator && index > 0 && (
              <span className="text-fg-subtle" aria-hidden="true">
                {separator}
              </span>
            )}
            <ItemTooltipIcon
              id={id}
              src={src}
              fallbackSrc={fallbackSrc}
              label={`アイテム${id}`}
              size={36}
            />
          </Fragment>
        );
      })}
    </div>
  );
}

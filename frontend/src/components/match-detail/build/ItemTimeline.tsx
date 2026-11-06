import { Fragment } from 'react';
import { NoData } from '@/components/champion-build';
import type { ItemPurchaseGroup } from '@/types/matchDetail';
import { ItemGroup } from './ItemGroup';

interface ItemTimelineProps {
  groups: ItemPurchaseGroup[];
}

// アイテムの購入順。分ごとのまとまりを「>」でつなぐ
export function ItemTimeline({ groups }: ItemTimelineProps) {
  if (groups.length === 0) return <NoData />;
  return (
    <ol className="flex flex-wrap items-start gap-2">
      {groups.map((group, i) => (
        <Fragment key={`${group.minute}-${i}`}>
          {i > 0 && (
            <li aria-hidden="true" className="pt-1.5 text-fg-subtle">
              &gt;
            </li>
          )}
          <li>
            <ItemGroup group={group} />
          </li>
        </Fragment>
      ))}
    </ol>
  );
}

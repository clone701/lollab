'use client';

import { SUMMONER_SPELLS } from '@/lib/data/summonerSpells';
import { toItemCounts } from './toItemCounts';
import { ViewItemIcon } from './ViewItemIcon';
import { ViewSpellIcon } from './ViewSpellIcon';

interface SpellItemViewProps {
  spells: string[];
  items: string[];
}

// 閲覧モード用: SS・アイテムを選択済みのみ横並び表示
export function SpellItemView({ spells, items }: SpellItemViewProps) {
  const selectedSpells = SUMMONER_SPELLS.filter((s) => spells.includes(s.id));
  const selectedItems = toItemCounts(items);

  return (
    <div className="flex flex-wrap items-center gap-4 mb-6">
      <div>
        <p className="text-xs text-fg-muted mb-1">サモナースペル</p>
        <div className="flex gap-2">
          {selectedSpells.length === 0 ? (
            <span className="text-xs text-fg-subtle">未設定</span>
          ) : (
            selectedSpells.map((s) => <ViewSpellIcon key={s.id} spell={s} />)
          )}
        </div>
      </div>
      <div className="w-px h-10 bg-surface-2" />
      <div>
        <p className="text-xs text-fg-muted mb-1">初期アイテム</p>
        <div className="flex gap-2 flex-wrap">
          {selectedItems.length === 0 ? (
            <span className="text-xs text-fg-subtle">未設定</span>
          ) : (
            selectedItems.map(({ item, count }) => (
              <ViewItemIcon key={item.id} item={item} count={count} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

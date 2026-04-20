'use client';

import { memo, useMemo } from 'react';
import { STARTER_ITEMS } from '@/lib/data/items';

interface ItemBuildSelectorProps {
  value: string[];
  onChange: (items: string[]) => void;
  disabled?: boolean;
}

function ItemBuildSelector({
  value,
  onChange,
  disabled = false,
}: ItemBuildSelectorProps) {
  const totalGold = useMemo(
    () =>
      value.reduce(
        (sum, id) => sum + (STARTER_ITEMS.find((i) => i.id === id)?.gold ?? 0),
        0
      ),
    [value]
  );

  const itemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    value.forEach((id) => {
      counts[id] = (counts[id] || 0) + 1;
    });
    return counts;
  }, [value]);

  const handleClick = (itemId: string) => {
    const item = STARTER_ITEMS.find((i) => i.id === itemId);
    if (!item) return;
    const count = itemCounts[itemId] || 0;
    if (count > 0) {
      // 選択済み → 1個削除
      const index = value.lastIndexOf(itemId);
      onChange([...value.slice(0, index), ...value.slice(index + 1)]);
    } else if (totalGold + item.gold <= 500) {
      // 未選択 → 追加
      onChange([...value, itemId]);
    }
  };

  const handleBadgeClick = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const item = STARTER_ITEMS.find((i) => i.id === itemId);
    if (!item || totalGold + item.gold > 500) return;
    // バッジクリック → 1個追加（複数個対応）
    onChange([...value, itemId]);
  };

  return (
    <div>
      <div className="mb-3 text-sm">
        <span
          className={`font-semibold ${totalGold > 500 ? 'text-red-600' : 'text-gray-700'}`}
        >
          合計: {totalGold}g / 500g
        </span>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {STARTER_ITEMS.map((item) => {
          const count = itemCounts[item.id] || 0;
          const isSelected = count > 0;
          const wouldExceed = !isSelected && totalGold + item.gold > 500;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => !disabled && handleClick(item.id)}
              disabled={disabled || wouldExceed}
              className={`relative flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[100px] ${
                isSelected
                  ? 'ring-2 ring-blue-500 shadow-md shadow-blue-500/20 bg-blue-50'
                  : wouldExceed || disabled
                    ? 'opacity-50 cursor-not-allowed bg-gray-50'
                    : 'hover:ring-2 hover:ring-gray-300 bg-white'
              }`}
              aria-label={`${item.name} ${item.gold}g${count > 0 ? ` (x${count} 選択中、クリックで1個削除)` : ''}`}
              aria-pressed={isSelected}
            >
              {/* 数量バッジ: 1個以上の時に表示、クリックで1個追加 */}
              {count >= 1 && (
                <span
                  role="button"
                  tabIndex={disabled || totalGold + item.gold > 500 ? -1 : 0}
                  onClick={(e) => !disabled && handleBadgeClick(item.id, e)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' &&
                    !disabled &&
                    handleBadgeClick(item.id, e as unknown as React.MouseEvent)
                  }
                  className={`absolute top-1 right-1 bg-gray-800 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center transition-colors ${
                    disabled || totalGold + item.gold > 500
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-amber-500 cursor-pointer'
                  }`}
                  aria-label={`${item.name}をもう1個追加`}
                  title="クリックでもう1個追加"
                >
                  x{count}
                </span>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.icon}
                alt={item.name}
                width={40}
                height={40}
                className="w-10 h-10"
                loading="lazy"
              />
              <span className="text-xs text-gray-700 text-center leading-tight mt-1">
                {item.name}
              </span>
              <span
                className={`text-xs ${wouldExceed || disabled ? 'text-gray-400' : 'text-gray-500'}`}
              >
                {item.gold}g
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default memo(ItemBuildSelector);

'use client';

import { memo, useMemo } from 'react';
import { STARTER_ITEMS } from '@/lib/data/items';

interface ItemBuildSelectorProps {
    value: string[];
    onChange: (items: string[]) => void;
    disabled?: boolean;
}

/**
 * ItemBuildSelector - 初期アイテム選択UIコンポーネント
 * 
 * 機能:
 * - 500g制限: 合計金額が500gを超える場合は追加選択不可
 * - 数量表示: 同じアイテムを複数選択した場合、右上に「x2」などの数量バッジを表示
 * - 選択不可UI: 500g超過により選択できないアイテムは半透明で表示
 */
function ItemBuildSelector({ value, onChange, disabled = false }: ItemBuildSelectorProps) {
    // 選択中のアイテムの合計金額を計算
    const totalGold = useMemo(() => {
        return value.reduce((sum, itemId) => {
            const item = STARTER_ITEMS.find(i => i.id === itemId);
            return sum + (item?.gold || 0);
        }, 0);
    }, [value]);

    // 各アイテムの選択数をカウント
    const itemCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        value.forEach(itemId => {
            counts[itemId] = (counts[itemId] || 0) + 1;
        });
        return counts;
    }, [value]);

    const handleItemClick = (itemId: string, event: React.MouseEvent) => {
        const item = STARTER_ITEMS.find(i => i.id === itemId);
        if (!item) return;

        const currentCount = itemCounts[itemId] || 0;

        // 右クリックまたはShift+クリックで削除
        if (event.shiftKey || event.button === 2) {
            if (currentCount > 0) {
                const index = value.lastIndexOf(itemId);
                onChange([...value.slice(0, index), ...value.slice(index + 1)]);
            }
            return;
        }

        // 通常のクリック: 500g以内なら追加
        if (totalGold + item.gold <= 500) {
            onChange([...value, itemId]);
        }
    };

    return (
        <div>
            {/* 合計金額表示 */}
            <div className="mb-3 text-sm">
                <span className={`font-semibold ${totalGold > 500 ? 'text-red-600' : 'text-gray-700'}`}>
                    合計: {totalGold}g / 500g
                </span>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {STARTER_ITEMS.map((item) => {
                    const count = itemCounts[item.id] || 0;
                    const isSelected = count > 0;
                    const wouldExceedLimit = (totalGold + item.gold > 500);

                    return (
                        <button
                            key={item.id}
                            onClick={(e) => handleItemClick(item.id, e)}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                handleItemClick(item.id, e);
                            }}
                            disabled={disabled || wouldExceedLimit}
                            className={`relative flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] ${isSelected
                                ? 'ring-2 ring-blue-500 shadow-md shadow-blue-500/20 bg-blue-50'
                                : wouldExceedLimit || disabled
                                    ? 'border border-gray-200 opacity-50 cursor-not-allowed bg-gray-50'
                                    : 'border border-gray-200 hover:ring-2 hover:ring-gray-300 bg-white'
                                }`}
                            aria-label={`初期アイテム: ${item.name} ${item.gold}g${count > 0 ? ` (x${count})` : ''}`}
                            aria-pressed={isSelected}
                            aria-disabled={disabled || wouldExceedLimit}
                        >
                            {/* 数量バッジ（2個以上選択時） */}
                            {count > 1 && (
                                <div className="absolute top-1 right-1 bg-black text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                    x{count}
                                </div>
                            )}

                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={item.icon}
                                alt={item.name}
                                className="w-10 h-10"
                                width={40}
                                height={40}
                                loading="lazy"
                            />
                            <span className="text-xs text-gray-700 text-center leading-tight mt-1">{item.name}</span>
                            <span className={`text-xs ${wouldExceedLimit || disabled ? 'text-gray-400' : 'text-gray-500'}`}>
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

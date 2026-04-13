/**
 * FavoriteChampionsコンポーネント
 * 
 * よく使うチャンピオンの横スクロールリスト
 * 要件: 4.1, 4.2, 4.3, 4.4, 4.5, 14.4
 */

'use client';

import React, { useCallback } from 'react';
import { Champion } from '@/types/champion';

interface FavoriteChampionsProps {
    /** チャンピオンリスト（最大10件） */
    champions: Champion[];
    /** 選択されているチャンピオンID */
    selectedId: string | null;
    /** チャンピオン選択ハンドラー */
    onSelect: (championId: string) => void;
}

/**
 * よく使うチャンピオンの横スクロールリスト
 * 
 * 円形のチャンピオン画像を横スクロール可能なリストで表示
 * 最大10チャンピオンまで表示し、選択状態をリング表示でハイライト
 * React.memoでメモ化してパフォーマンスを最適化（要件: 14.4）
 */
const FavoriteChampions: React.FC<FavoriteChampionsProps> = React.memo(({ champions, selectedId, onSelect }) => {
    // イベントハンドラーのメモ化（要件: 14.3）
    const handleSelect = useCallback((championId: string) => {
        onSelect(championId);
    }, [onSelect]);
    return (
        <div className="overflow-x-auto">
            <div className="flex gap-3 pb-2">
                {champions.slice(0, 10).map(champion => (
                    <button
                        key={champion.id}
                        onClick={() => handleSelect(champion.id)}
                        className="flex flex-col items-center gap-1 min-w-[48px] flex-shrink-0"
                        aria-label={`${champion.name}を選択`}
                        aria-pressed={selectedId === champion.id}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={champion.imagePath}
                            alt={champion.name}
                            className={`
                                w-12 h-12 rounded-full
                                transition-all duration-150
                                ${selectedId === champion.id
                                    ? 'ring-2 ring-black'
                                    : 'hover:ring-2 hover:ring-gray-300'
                                }
                            `}
                            loading="lazy"
                            width={48}
                            height={48}
                        />
                        <span className="text-[10px] text-center text-gray-700 leading-tight">{champion.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
});

FavoriteChampions.displayName = 'FavoriteChampions';

export default FavoriteChampions;

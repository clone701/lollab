/**
 * ChampionSelectorSidebarコンポーネント
 * 
 * 左サイドバーのチャンピオン選択UI
 * 要件: 3.1, 3.2, 3.4, 3.5, 6.1, 6.2, 6.3, 6.4, 6.5
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { champions } from '@/lib/data/champions';
import FavoriteChampions from './FavoriteChampions';
import ChampionButton from './ChampionButton';
import useRecentChampions from '@/lib/hooks/useRecentChampions';

interface ChampionSelectorSidebarProps {
    /** 自分のチャンピオンID */
    myChampionId: string | null;
    /** 相手のチャンピオンID */
    enemyChampionId: string | null;
    /** 自分のチャンピオン変更ハンドラー */
    onMyChampionChange: (championId: string) => void;
    /** 相手のチャンピオン変更ハンドラー */
    onEnemyChampionChange: (championId: string) => void;
    /** リセットハンドラー */
    onReset?: () => void;
}

/**
 * チャンピオン選択サイドバー
 * 
 * 固定幅（320px）のスクロール可能なサイドバー
 * チャンピオン選択セクションを含む
 */
const ChampionSelectorSidebar: React.FC<ChampionSelectorSidebarProps> = React.memo(({
    myChampionId,
    enemyChampionId,
    onMyChampionChange,
    onEnemyChampionChange,
    onReset,
}) => {
    // 検索クエリの状態管理
    const [searchQuery, setSearchQuery] = useState('');

    // 選択モード: 'my' | 'enemy'
    const [selectionMode, setSelectionMode] = useState<'my' | 'enemy'>('my');

    // 直近選択したチャンピオンを管理
    const { recentChampions, addRecentChampion } = useRecentChampions();

    // 選択されたチャンピオンを取得（要件: 14.3 - useMemoでメモ化）
    const myChampion = useMemo(() =>
        myChampionId ? champions.find(c => c.id === myChampionId) : null,
        [myChampionId]
    );

    const enemyChampion = useMemo(() =>
        enemyChampionId ? champions.find(c => c.id === enemyChampionId) : null,
        [enemyChampionId]
    );

    // チャンピオンリストのフィルタリング（要件: 6.2, 6.3, 6.4, 14.3 - useMemoでメモ化）
    const filteredChampions = useMemo(() => {
        if (!searchQuery) return champions;

        const query = searchQuery.toLowerCase();
        return champions.filter(champion =>
            champion.name.toLowerCase().includes(query) ||
            champion.id.toLowerCase().includes(query)
        );
    }, [searchQuery]);

    // イベントハンドラーのメモ化（要件: 14.3 - useCallbackでメモ化）
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    }, []);

    const handleChampionSelect = useCallback((championId: string) => {
        // 履歴に追加
        addRecentChampion(championId);

        if (selectionMode === 'my') {
            onMyChampionChange(championId);
            // 自分のチャンピオンを選択したら、次は相手のチャンピオン選択モードに
            setSelectionMode('enemy');
        } else {
            onEnemyChampionChange(championId);
        }
        // チャンピオン選択時に検索クエリをリセット
        setSearchQuery('');
    }, [selectionMode, onMyChampionChange, onEnemyChampionChange, addRecentChampion]);

    const handleMyChampionClick = useCallback(() => {
        setSelectionMode('my');
    }, []);

    const handleEnemyChampionClick = useCallback(() => {
        setSelectionMode('enemy');
    }, []);

    return (
        <aside className="w-80 h-screen overflow-y-auto bg-white border-r border-gray-200">
            <div className="p-4">
                {/* 自分のチャンピオンを選択セクション */}
                <section className="mb-4">
                    <button
                        onClick={handleMyChampionClick}
                        className={`
                            w-full p-3 rounded-lg transition-colors
                            ${selectionMode === 'my'
                                ? 'bg-blue-100 border-2 border-blue-400'
                                : 'bg-blue-50 border border-blue-200 hover:bg-blue-100'
                            }
                        `}
                    >
                        {myChampion ? (
                            <div className="flex items-center gap-3">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={myChampion.imagePath}
                                    alt={myChampion.name}
                                    className="w-12 h-12 rounded-full"
                                    width={48}
                                    height={48}
                                />
                                <div className="flex flex-col items-start">
                                    <span className="text-xs text-gray-500">自分</span>
                                    <span className="text-base font-semibold text-gray-800">
                                        {myChampion.name}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400">
                                自分のチャンピオンを選択
                            </p>
                        )}
                    </button>
                </section>

                {/* 相手のチャンピオンを選択セクション */}
                <section className="mb-4">
                    <button
                        onClick={handleEnemyChampionClick}
                        className={`
                            w-full p-3 rounded-lg transition-colors
                            ${selectionMode === 'enemy'
                                ? 'bg-red-100 border-2 border-red-400'
                                : 'bg-red-50 border border-red-200 hover:bg-red-100'
                            }
                        `}
                    >
                        {enemyChampion ? (
                            <div className="flex items-center gap-3">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={enemyChampion.imagePath}
                                    alt={enemyChampion.name}
                                    className="w-12 h-12 rounded-full"
                                    width={48}
                                    height={48}
                                />
                                <div className="flex flex-col items-start">
                                    <span className="text-xs text-gray-500">相手</span>
                                    <span className="text-base font-semibold text-gray-800">
                                        {enemyChampion.name}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400">
                                相手のチャンピオンを選択
                            </p>
                        )}
                    </button>
                </section>

                {/* チャンピオン検索セクション（要件: 6.1） */}
                {!(myChampionId && enemyChampionId) && (
                    <section className="mb-4">
                        <input
                            type="text"
                            placeholder="チャンピオン名で検索..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                    </section>
                )}

                {/* リセットボタン（両方選択時のみ表示） */}
                {myChampionId && enemyChampionId && (
                    <section className="mb-4">
                        <button
                            onClick={() => {
                                if (onReset) {
                                    onReset();
                                } else {
                                    onMyChampionChange(null as any);
                                    onEnemyChampionChange(null as any);
                                }
                                setSelectionMode('my');
                            }}
                            className="w-full py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            リセット
                        </button>
                    </section>
                )}

                {/* よく使うチャンピオンセクション */}
                {!(myChampionId && enemyChampionId) && recentChampions.length > 0 && (
                    <section className="mb-4">
                        <h2 className="text-sm font-semibold text-gray-800 mb-2">
                            よく使うチャンピオン
                        </h2>
                        <FavoriteChampions
                            champions={recentChampions}
                            selectedId={selectionMode === 'my' ? myChampionId : enemyChampionId}
                            onSelect={handleChampionSelect}
                        />
                    </section>
                )}

                {/* チャンピオン一覧セクション */}
                {!(myChampionId && enemyChampionId) && (
                    <section className="mb-4">
                        <h2 className="text-sm font-semibold text-gray-800 mb-2">
                            チャンピオン一覧
                        </h2>
                        <div className="space-y-1 max-h-96 overflow-y-auto">
                            {filteredChampions.length > 0 ? (
                                filteredChampions.map(champion => (
                                    <ChampionButton
                                        key={champion.id}
                                        champion={champion}
                                        selected={
                                            selectionMode === 'my'
                                                ? myChampionId === champion.id
                                                : enemyChampionId === champion.id
                                        }
                                        onClick={() => handleChampionSelect(champion.id)}
                                    />
                                ))
                            ) : (
                                // 要件: 6.5 - 検索結果0件時のメッセージ
                                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
                                    <p className="text-xs text-gray-500">
                                        該当するチャンピオンが見つかりません
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>
                )}
            </div>
        </aside>
    );
});

ChampionSelectorSidebar.displayName = 'ChampionSelectorSidebar';

export default ChampionSelectorSidebar;

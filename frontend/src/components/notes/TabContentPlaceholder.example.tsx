/**
 * TabContentPlaceholder使用例
 * 
 * このファイルは実装の参考例です。
 * 実際のNotesページ（Task 5）で使用されます。
 */

'use client';

import React, { useState } from 'react';
import TabNavigation, { TabType } from './TabNavigation';
import TabContentPlaceholder from './TabContentPlaceholder';

/**
 * TabContentPlaceholder使用例
 * 
 * NotesページでTabNavigationとTabContentPlaceholderを組み合わせて使用する例
 */
export default function TabContentPlaceholderExample() {
    const [activeTab, setActiveTab] = useState<TabType>('create');
    const [myChampionId, setMyChampionId] = useState<string | null>(null);
    const [enemyChampionId, setEnemyChampionId] = useState<string | null>(null);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* タブナビゲーション */}
            <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

            {/* メインコンテンツエリア */}
            <div className="flex">
                {/* 左サイドバー（タブによって表示/非表示） */}
                {(activeTab === 'create' || activeTab === 'matchup') && (
                    <aside className="w-80 bg-white border-r border-gray-200 p-4">
                        <p className="text-sm text-gray-600">
                            ChampionSelectorSidebar（Task 3で実装済み）
                        </p>
                    </aside>
                )}

                {/* 右メインエリア */}
                <main className="flex-1">
                    <TabContentPlaceholder
                        tab={activeTab}
                        myChampionId={myChampionId}
                        enemyChampionId={enemyChampionId}
                    />
                </main>
            </div>
        </div>
    );
}

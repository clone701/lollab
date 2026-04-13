/**
 * TabNavigationコンポーネント
 * 
 * タブの表示と切り替え
 * 要件: 2.1, 2.2, 2.3, 2.4, 2.5
 */

'use client';

import React from 'react';

/** タブの種類 */
export type TabType = 'matchup' | 'general';

interface TabNavigationProps {
    /** アクティブなタブ */
    activeTab: TabType;
    /** タブ変更ハンドラー */
    onTabChange: (tab: TabType) => void;
}

/** タブ定義 */
interface Tab {
    id: TabType;
    label: string;
}

const tabs: Tab[] = [
    { id: 'matchup', label: '対策ノート' },
    { id: 'general', label: '汎用ノート' }
];

/**
 * タブナビゲーション
 * 
 * 3つのタブ（新規ノート作成・汎用ノート・チャンピオン対策ノート）を表示し、
 * アクティブなタブを下線と黒色で強調表示する
 */
const TabNavigation: React.FC<TabNavigationProps> = React.memo(({ activeTab, onTabChange }) => {
    return (
        <div className="border-b border-gray-200 bg-white">
            <div className="flex gap-1 px-4 overflow-x-auto">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`
                px-3 py-2 text-sm font-medium whitespace-nowrap
                transition-colors duration-150
                border-b-2
                ${isActive
                                    ? 'border-black text-black'
                                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                                }
              `}
                            aria-label={`${tab.label}タブ`}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
});

TabNavigation.displayName = 'TabNavigation';

export default TabNavigation;

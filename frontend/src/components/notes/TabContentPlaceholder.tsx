/**
 * TabContentPlaceholderコンポーネント
 * 
 * 各タブのプレースホルダー表示
 * 要件: 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 9.1, 9.2, 9.3, 9.4
 */

'use client';

import React from 'react';

/** タブの種類 */
type TabType = 'create' | 'general' | 'matchup';

interface TabContentPlaceholderProps {
    /** アクティブなタブ */
    tab: TabType;
    /** 自分のチャンピオンID */
    myChampionId: string | null;
    /** 相手のチャンピオンID */
    enemyChampionId: string | null;
}

/**
 * タブコンテンツプレースホルダー
 * 
 * タブごとに異なるプレースホルダーメッセージを表示する
 * - 新規ノート作成: チャンピオン選択を促すメッセージ
 * - 汎用ノート: 別Spec実装予定のメッセージ
 * - チャンピオン対策ノート: チャンピオン選択と別Spec実装予定のメッセージ
 * 
 * @param tab - アクティブなタブ
 * @param myChampionId - 自分のチャンピオンID（将来の実装で使用予定）
 * @param enemyChampionId - 相手のチャンピオンID（将来の実装で使用予定）
 */
const TabContentPlaceholder: React.FC<TabContentPlaceholderProps> = ({ tab }) => {
    // 新規ノート作成タブ
    if (tab === 'create') {
        return (
            <div className="flex items-center justify-center h-full p-8">
                <div className="text-center text-gray-500">
                    <p className="text-lg mb-2">チャンピオンを選択してください</p>
                    <p className="text-sm">
                        左のパネルで自分のチャンピオンと相手のチャンピオンを選択してください
                    </p>
                </div>
            </div>
        );
    }

    // 汎用ノートタブ
    if (tab === 'general') {
        return (
            <div className="flex items-center justify-center h-full p-8">
                <div className="text-center text-gray-500">
                    <p className="text-lg mb-2">汎用ノート機能</p>
                    <p className="text-sm">
                        汎用ノート機能は別Specで実装予定です
                    </p>
                </div>
            </div>
        );
    }

    // チャンピオン対策ノートタブ
    if (tab === 'matchup') {
        return (
            <div className="flex items-center justify-center h-full p-8">
                <div className="text-center text-gray-500">
                    <p className="text-lg mb-2">チャンピオンを選択してください</p>
                    <p className="text-sm">
                        対策ノート一覧機能は別Specで実装予定です
                    </p>
                </div>
            </div>
        );
    }

    return null;
};

export default TabContentPlaceholder;

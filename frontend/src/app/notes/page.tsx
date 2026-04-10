/**
 * Notes Page
 * 
 * ノートページ全体のレイアウトとタブ管理
 * 要件: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 3.4, 12.1, 12.2, 12.3, 12.4, 13.1, 13.2, 14.5
 */

'use client';

import React, { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import GlobalLoading from '@/components/GlobalLoading';
import TabNavigation, { TabType } from '@/components/notes/TabNavigation';
import ChampionSelectorSidebar from '@/components/notes/ChampionSelectorSidebar';
import TabContentPlaceholder from '@/components/notes/TabContentPlaceholder';

/**
 * ノートページ
 * 
 * 認証状態を確認し、タブナビゲーションとチャンピオン選択UIを提供する
 * 2カラムレイアウト（左サイドバー + 右メインエリア）
 */
export default function NotesPage() {
    // 認証状態の確認（要件: 12.2）
    const { data: session, status } = useSession();

    // 状態管理（要件: 5.2）
    const [activeTab, setActiveTab] = useState<TabType>('create'); // デフォルト: 新規ノート作成
    const [myChampionId, setMyChampionId] = useState<string | null>(null);
    const [enemyChampionId, setEnemyChampionId] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false); // モバイル用

    // ローディング中の表示（要件: 12.3, 13.1, 13.2）
    if (status === 'loading') {
        return <GlobalLoading loading={true} />;
    }

    // 未認証時の表示（要件: 1.3, 12.1）
    if (status === 'unauthenticated') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center p-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                        ログインが必要です
                    </h2>
                    <p className="text-gray-600 mb-6">
                        ノート機能を利用するには、ログインしてください。
                    </p>
                    <button
                        onClick={() => signIn()}
                        className="px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors duration-150"
                    >
                        ログイン
                    </button>
                </div>
            </div>
        );
    }

    // サイドバーを表示するかどうかの判定（要件: 2.4）
    const shouldShowSidebar = activeTab === 'create' || activeTab === 'matchup';

    // タブ切り替えハンドラー（要件: 2.3, 14.5）
    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
    };

    // チャンピオン選択ハンドラー（要件: 3.4, 5.5）
    const handleMyChampionChange = (championId: string) => {
        setMyChampionId(championId);
    };

    const handleEnemyChampionChange = (championId: string) => {
        setEnemyChampionId(championId);
    };

    // リセットハンドラー
    const handleReset = () => {
        setMyChampionId(null);
        setEnemyChampionId(null);
    };

    // サイドバー開閉ハンドラー（モバイル用）
    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* タブナビゲーション（要件: 2.1, 2.5, 5.4） */}
            <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />

            {/* 2カラムレイアウト（要件: 1.4, 5.3） */}
            <div className="flex">
                {/* 左サイドバー - デスクトップ（要件: 6.1） */}
                {shouldShowSidebar && (
                    <div className="hidden md:block">
                        <ChampionSelectorSidebar
                            myChampionId={myChampionId}
                            enemyChampionId={enemyChampionId}
                            onMyChampionChange={handleMyChampionChange}
                            onEnemyChampionChange={handleEnemyChampionChange}
                            onReset={handleReset}
                        />
                    </div>
                )}

                {/* 左サイドバー - モバイル（オーバーレイ）（要件: 6.2, 10.1, 10.2, 10.3） */}
                {shouldShowSidebar && sidebarOpen && (
                    <div className="fixed inset-0 z-50 md:hidden">
                        {/* 背景オーバーレイ */}
                        <div
                            className="absolute inset-0 bg-black/50"
                            onClick={closeSidebar}
                            aria-label="サイドバーを閉じる"
                        />
                        {/* サイドバー */}
                        <div className="absolute left-0 top-0 bottom-0 w-80 bg-white">
                            <ChampionSelectorSidebar
                                myChampionId={myChampionId}
                                enemyChampionId={enemyChampionId}
                                onMyChampionChange={handleMyChampionChange}
                                onEnemyChampionChange={handleEnemyChampionChange}
                                onReset={handleReset}
                            />
                        </div>
                    </div>
                )}

                {/* 右メインエリア（要件: 5.3） */}
                <div className="flex-1 min-h-screen">
                    <TabContentPlaceholder
                        tab={activeTab}
                        myChampionId={myChampionId}
                        enemyChampionId={enemyChampionId}
                    />
                </div>
            </div>

            {/* ハンバーガーメニューボタン - モバイルのみ（要件: 6.2, 10.2） */}
            {shouldShowSidebar && (
                <button
                    onClick={toggleSidebar}
                    className="md:hidden fixed bottom-4 right-4 z-40 bg-pink-500 text-white p-4 rounded-full shadow-lg hover:bg-pink-600 transition-colors duration-150"
                    aria-label="チャンピオン選択メニューを開く"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 6h16M4 12h16M4 18h16"
                        />
                    </svg>
                </button>
            )}
        </div>
    );
}

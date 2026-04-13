/**
 * Notes Page
 * 
 * ノートページ全体のレイアウトとタブ管理
 * 要件: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 3.4, 12.1, 12.2, 12.3, 12.4, 13.1, 13.2, 14.5
 */

'use client';

import React, { useState } from 'react';
import GlobalLoading from '@/components/GlobalLoading';
import TabNavigation, { TabType } from '@/components/notes/TabNavigation';
import ChampionSelectorSidebar from '@/components/notes/ChampionSelectorSidebar';
import TabContentPlaceholder from '@/components/notes/TabContentPlaceholder';
import NoteList from '@/components/notes/NoteList';
import NoteForm from '@/components/notes/NoteForm';
import DeleteConfirmationDialog from '@/components/notes/DeleteConfirmationDialog';
import Toast from '@/components/ui/Toast';
import { useAuth } from '@/lib/contexts/AuthContext';
import { ChampionNote } from '@/types/note';
import { fetchNoteById, deleteNote } from '@/lib/api/notes';
import { getChampionById } from '@/lib/utils/championHelpers';
import useToast from '@/lib/hooks/useToast';
import Image from 'next/image';

/**
 * ノートページ
 * 
 * 認証状態を確認し、タブナビゲーションとチャンピオン選択UIを提供する
 * 2カラムレイアウト（左サイドバー + 右メインエリア）
 */
export default function NotesPage() {
    // 認証状態の確認（要件: 12.2）
    const { user, session, loading } = useAuth();
    const { toast, showToast, hideToast } = useToast();

    // 状態管理（要件: 5.2）
    const [activeTab, setActiveTab] = useState<TabType>('matchup'); // デフォルト: 対策ノート
    const [myChampionId, setMyChampionId] = useState<string | null>(null);
    const [enemyChampionId, setEnemyChampionId] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false); // モバイル用
    const [showForm, setShowForm] = useState(false); // フォーム表示状態（要件: 2, 7, 10）
    const [refreshKey, setRefreshKey] = useState(0); // ノート一覧の再フェッチ用

    // ノート閲覧・編集の状態管理（要件: 12.1, 12.2）
    const [viewMode, setViewMode] = useState<'list' | 'view' | 'edit'>('list');
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
    const [selectedNote, setSelectedNote] = useState<ChampionNote | null>(null);
    const [noteLoading, setNoteLoading] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false); // 削除確認ダイアログの表示状態

    // ローディング中の表示（要件: 12.3, 13.1, 13.2）
    if (loading) {
        return <GlobalLoading loading={true} />;
    }

    // 未認証時の表示（要件: 1.3, 12.1）
    if (!session) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center p-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                        ログインが必要です
                    </h2>
                    <p className="text-gray-600">
                        ノート機能を利用するには、ログインしてください。
                    </p>
                </div>
            </div>
        );
    }

    // サイドバーを表示するかどうかの判定（要件: 2.4）
    const shouldShowSidebar = activeTab === 'matchup';

    // タブ切り替えハンドラー（要件: 2.3, 14.5）
    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        // タブ切り替え時はフォームを閉じる
        setShowForm(false);
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
        setShowForm(false);
    };

    // ノート作成ハンドラー（要件: 7, 10）
    const handleCreateNew = () => {
        setShowForm(true);
    };

    // ノート保存ハンドラー（要件: 7, 10）
    const handleSave = () => {
        showToast('ノートを作成しました', 'success');
        setShowForm(false);
        // ノート一覧を再フェッチするためにキーを更新
        setRefreshKey(prev => prev + 1);
    };

    // キャンセルハンドラー（要件: 7, 10）
    const handleCancel = () => {
        setShowForm(false);
    };

    // ノートカードクリック時のハンドラ（要件: 1.1, 10.1, 10.2, 10.3, 10.4）
    const handleNoteClick = async (noteId: number) => {
        if (!user) return;

        setNoteLoading(true);
        try {
            const note = await fetchNoteById(noteId.toString(), user.id);
            if (note) {
                setSelectedNote(note);
                setSelectedNoteId(noteId.toString());
                setViewMode('view');
            } else {
                // ノートが見つからない場合
                console.error('Note not found');
                // TODO: トースト通知でエラーメッセージを表示
            }
        } catch (error) {
            console.error('Failed to fetch note:', error);
            // TODO: トースト通知でエラーメッセージを表示
        } finally {
            setNoteLoading(false);
        }
    };

    // 編集ボタンクリック時のハンドラ（要件: 3.1）
    const handleEdit = () => {
        setViewMode('edit');
    };

    // 削除ボタンクリック時のハンドラ（要件: 6.1）
    const handleDeleteClick = () => {
        setShowDeleteDialog(true);
    };

    // 削除確認ダイアログの確認ボタンハンドラ（要件: 7.1, 7.2, 7.3, 7.4, 7.5）
    const handleDeleteConfirm = async () => {
        if (!user || !selectedNoteId) return;

        try {
            await deleteNote(selectedNoteId, user.id);
            // 成功時: トースト通知表示、viewMode='list'に設定
            showToast('ノートを削除しました', 'success');
            setShowDeleteDialog(false);
            setViewMode('list');
            setSelectedNote(null);
            setSelectedNoteId(null);
            // ノート一覧を再フェッチ
            setRefreshKey(prev => prev + 1);
        } catch (error) {
            console.error('Failed to delete note:', error);
            // 失敗時: トースト通知でエラーメッセージ表示、ダイアログを閉じる
            showToast('ノートの削除に失敗しました', 'error');
            setShowDeleteDialog(false);
        }
    };

    // 削除確認ダイアログのキャンセルボタンハンドラ（要件: 6.5）
    const handleDeleteCancel = () => {
        setShowDeleteDialog(false);
    };

    // 一覧へ戻るボタンクリック時のハンドラ（要件: 8.1, 8.3）
    const handleBackToList = () => {
        setViewMode('list');
        setSelectedNote(null);
        setSelectedNoteId(null);
    };

    // 編集モードの保存ハンドラ（要件: 4.6, 4.7）
    const handleEditSave = () => {
        // 保存後、データを再取得して閲覧モードに戻る
        if (selectedNoteId && user) {
            fetchNoteById(selectedNoteId, user.id).then(note => {
                if (note) {
                    setSelectedNote(note);
                    setViewMode('view');
                }
            });
        }
    };

    // 編集モードのキャンセルハンドラ（要件: 5.1, 5.2, 5.3）
    const handleEditCancel = () => {
        setViewMode('view');
    };

    // サイドバー開閉ハンドラー（モバイル用）
    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    return (
        <div className="min-h-screen">
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
                    {/* 対策ノートタブ: viewModeに応じて表示を切り替え */}
                    {activeTab === 'matchup' && (
                        <div className="p-6 max-w-5xl mx-auto">
                            {!myChampionId || !enemyChampionId ? (
                                // チャンピオン未選択時
                                <div className="flex items-center justify-center h-96">
                                    <div className="text-center text-gray-500">
                                        <p className="text-lg mb-2">チャンピオンを選択してください</p>
                                        <p className="text-sm">
                                            左のパネルで自分のチャンピオンと相手のチャンピオンを選択してください
                                        </p>
                                    </div>
                                </div>
                            ) : viewMode === 'list' ? (
                                // 一覧表示モード
                                showForm ? (
                                    // フォーム表示
                                    <NoteForm
                                        mode="create"
                                        myChampionId={myChampionId}
                                        enemyChampionId={enemyChampionId}
                                        onCancel={handleCancel}
                                        onSave={handleSave}
                                    />
                                ) : (
                                    // ノート一覧表示
                                    <NoteList
                                        key={refreshKey}
                                        myChampionId={myChampionId}
                                        enemyChampionId={enemyChampionId}
                                        onCreateNew={handleCreateNew}
                                        onNoteClick={handleNoteClick}
                                    />
                                )
                            ) : noteLoading ? (
                                // ノート読み込み中
                                <div className="flex items-center justify-center h-96">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto mb-4"></div>
                                        <p className="text-gray-500">読み込み中...</p>
                                    </div>
                                </div>
                            ) : selectedNote ? (
                                // 閲覧・編集モード（タスク7, 8で実装）
                                <div>
                                    {/* 一覧へ戻るボタン（要件: 2.1, 2.2） */}
                                    <button
                                        onClick={handleBackToList}
                                        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
                                        aria-label="一覧へ戻る"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M15 19l-7-7 7-7"
                                            />
                                        </svg>
                                        <span className="text-sm font-medium">一覧へ戻る</span>
                                    </button>

                                    {/* チャンピオンアイコンとマッチアップ情報（要件: 2.3） */}
                                    <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <Image
                                                src={`/images/champion/${getChampionById(selectedNote.my_champion_id)?.id}.png`}
                                                alt={getChampionById(selectedNote.my_champion_id)?.name || ''}
                                                width={48}
                                                height={48}
                                                className="rounded-full"
                                            />
                                            <span className="text-sm font-medium text-gray-700">
                                                {getChampionById(selectedNote.my_champion_id)?.name}
                                            </span>
                                        </div>
                                        <span className="text-gray-400 text-xl">VS</span>
                                        <div className="flex items-center gap-2">
                                            <Image
                                                src={`/images/champion/${getChampionById(selectedNote.enemy_champion_id)?.id}.png`}
                                                alt={getChampionById(selectedNote.enemy_champion_id)?.name || ''}
                                                width={48}
                                                height={48}
                                                className="rounded-full"
                                            />
                                            <span className="text-sm font-medium text-gray-700">
                                                {getChampionById(selectedNote.enemy_champion_id)?.name}
                                            </span>
                                        </div>
                                    </div>

                                    {/* NoteForm（閲覧・編集モード）（要件: 2.6, 3.2, 3.3, 12.4, 12.5） */}
                                    <NoteForm
                                        mode={viewMode === 'view' ? 'view' : 'edit'}
                                        myChampionId={selectedNote.my_champion_id}
                                        enemyChampionId={selectedNote.enemy_champion_id}
                                        initialData={selectedNote}
                                        onEdit={handleEdit}
                                        onDelete={handleDeleteClick}
                                        onSave={handleEditSave}
                                        onCancel={handleEditCancel}
                                    />

                                    {/* 削除確認ダイアログ */}
                                    <DeleteConfirmationDialog
                                        isOpen={showDeleteDialog}
                                        onConfirm={handleDeleteConfirm}
                                        onCancel={handleDeleteCancel}
                                    />
                                </div>
                            ) : null}
                        </div>
                    )}

                    {/* その他のタブ: プレースホルダー表示 */}
                    {activeTab !== 'matchup' && (
                        <TabContentPlaceholder
                            tab={activeTab}
                            myChampionId={myChampionId}
                            enemyChampionId={enemyChampionId}
                        />
                    )}
                </div>
            </div>

            {/* トースト通知 */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={hideToast}
                />
            )}

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

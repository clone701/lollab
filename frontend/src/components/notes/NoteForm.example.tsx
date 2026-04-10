/**
 * NoteForm コンポーネント使用例
 * 
 * このファイルはNoteFormコンポーネントの使用方法を示す例です。
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import NoteForm from './NoteForm';
import { ChampionNote } from '@/types/note';

/**
 * 例1: ノート作成ページでの使用
 */
export function CreateNoteExample() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (data: Partial<ChampionNote>) => {
        setLoading(true);
        try {
            // API呼び出し（実装例）
            const response = await fetch('/api/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Failed to create note');
            }

            // 成功時はノート一覧ページにリダイレクト
            router.push('/notes');
        } catch (error) {
            console.error('Error creating note:', error);
            alert('ノートの作成に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        router.push('/notes');
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-white mb-6">新規ノート作成</h1>
            <NoteForm
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                loading={loading}
            />
        </div>
    );
}

/**
 * 例2: ノート編集ページでの使用
 */
export function EditNoteExample() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // 既存のノートデータ（実際にはAPIから取得）
    const existingNote: Partial<ChampionNote> = {
        id: 1,
        note_type: 'matchup',
        my_champion_id: 'Ahri',
        enemy_champion_id: 'Yasuo',
        memo: '既存の戦略メモ...',
    };

    const handleSubmit = async (data: Partial<ChampionNote>) => {
        setLoading(true);
        try {
            // API呼び出し（実装例）
            const response = await fetch(`/api/notes/${existingNote.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Failed to update note');
            }

            // 成功時はノート一覧ページにリダイレクト
            router.push('/notes');
        } catch (error) {
            console.error('Error updating note:', error);
            alert('ノートの更新に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        router.push('/notes');
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-white mb-6">ノート編集</h1>
            <NoteForm
                initialValues={existingNote}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                loading={loading}
                isEditMode={true}
            />
        </div>
    );
}

/**
 * 例3: カスタムエラーハンドリング
 */
export function CustomErrorHandlingExample() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (data: Partial<ChampionNote>) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create note');
            }

            router.push('/notes');
        } catch (error) {
            console.error('Error creating note:', error);
            setError(error instanceof Error ? error.message : 'ノートの作成に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        router.push('/notes');
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-white mb-6">新規ノート作成</h1>

            {/* カスタムエラーメッセージ */}
            {error && (
                <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-md mb-4">
                    {error}
                </div>
            )}

            <NoteForm
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                loading={loading}
            />
        </div>
    );
}

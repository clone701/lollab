/**
 * NoteCard コンポーネントの使用例
 * 
 * このファイルは実装の参考例です。実際のページでの使用方法を示しています。
 */

'use client';

import React, { useState } from 'react';
import NoteCard from './NoteCard';
import { ChampionNote } from '@/types/note';

export default function NoteCardExample() {
    const [notes] = useState<ChampionNote[]>([
        {
            id: 1,
            user_id: 'example-user',
            note_type: 'general',
            my_champion_id: 'Ahri',
            enemy_champion_id: null,
            runes: null,
            spells: null,
            items: null,
            memo: '基本的なビルドとプレイスタイル。序盤はファームを優先し、レベル6以降にロームを狙う。',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-15T12:30:00Z',
        },
        {
            id: 2,
            user_id: 'example-user',
            note_type: 'matchup',
            my_champion_id: 'Ahri',
            enemy_champion_id: 'Yasuo',
            runes: null,
            spells: null,
            items: null,
            memo: 'Yasuoのウィンドウォールに注意。Eでハラスしてから距離を取る。レベル3以降はオールインに注意。',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-20T15:45:00Z',
        },
    ]);

    const handleEdit = (id: number) => {
        console.log(`編集: ノートID ${id}`);
        // 実際の実装では、編集ページへのナビゲーションを行う
        // router.push(`/notes/edit/${id}`);
    };

    const handleDelete = (id: number) => {
        console.log(`削除: ノートID ${id}`);
        // 実際の実装では、確認ダイアログを表示してから削除APIを呼び出す
        // if (confirm('本当に削除しますか？')) {
        //   await deleteNote(id);
        //   // ノート一覧を再読み込み
        // }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold text-white mb-6">NoteCard 使用例</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {notes.map((note) => (
                    <NoteCard
                        key={note.id}
                        note={note}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                ))}
            </div>
        </div>
    );
}

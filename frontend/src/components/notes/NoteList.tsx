/**
 * NoteListコンポーネント
 *
 * ノート一覧の表示と管理
 * 要件: 1, 7, 8, 10, 11
 *
 * パフォーマンス最適化:
 * - useCallbackでイベントハンドラーをメモ化
 * - useMemoでフィルタリング最適化（将来の拡張用）
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChampionNote } from '@/types/note';
import { getNotes } from '@/lib/api/notes';
import NoteCard from './NoteCard';

interface NoteListProps {
  myChampionId: string | null;
  enemyChampionId: string | null;
  onCreateNew: () => void;
  onNoteClick?: (noteId: number) => void;
}

export default function NoteList({
  myChampionId,
  enemyChampionId,
  onCreateNew,
  onNoteClick,
}: NoteListProps) {
  const [notes, setNotes] = useState<ChampionNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // fetchNotesをuseCallbackでメモ化
  const fetchNotes = useCallback(async () => {
    if (!myChampionId || !enemyChampionId) {
      setNotes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getNotes(myChampionId, enemyChampionId);
      setNotes(data);
    } catch (err) {
      setError('ノートの取得に失敗しました');
      console.error('Failed to fetch notes:', err);
    } finally {
      setLoading(false);
    }
  }, [myChampionId, enemyChampionId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // リロードハンドラーをuseCallbackでメモ化
  const handleReload = useCallback(() => {
    window.location.reload();
  }, []);

  // チャンピオン未選択状態
  if (!myChampionId || !enemyChampionId) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-gray-500 text-lg">
            チャンピオンを選択してください
          </p>
        </div>
      </div>
    );
  }

  // ローディング状態
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto mb-4"></div>
          <p className="text-gray-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  // エラー状態
  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button
            onClick={handleReload}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-black transition focus:outline-none focus:ring-2 focus:ring-gray-800"
            aria-label="再読み込み"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  // メインコンテンツ
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">対策ノート一覧</h2>
        <button
          onClick={onCreateNew}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-black transition focus:outline-none focus:ring-2 focus:ring-gray-800"
          aria-label="新規ノート作成"
        >
          新規ノート作成
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center">
            <p className="text-gray-500 text-lg">ノートがありません</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} onClick={onNoteClick} />
          ))}
        </div>
      )}
    </div>
  );
}

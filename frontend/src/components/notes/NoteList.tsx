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

import { useCallback } from 'react';
import NoteCard from './NoteCard';
import { useChampionNotes } from './useChampionNotes';

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
  const { notes, loading, error } = useChampionNotes(
    myChampionId,
    enemyChampionId
  );

  // リロードハンドラーをuseCallbackでメモ化
  const handleReload = useCallback(() => {
    window.location.reload();
  }, []);

  // チャンピオン未選択状態
  if (!myChampionId || !enemyChampionId) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-fg-muted text-lg">
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-fg-muted">読み込み中...</p>
        </div>
      </div>
    );
  }

  // エラー状態
  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-danger-fg text-lg mb-4">{error}</p>
          <button
            onClick={handleReload}
            className="px-4 py-2 bg-action text-white rounded-lg hover:bg-action-hover transition focus:outline-none focus:ring-2 focus:ring-accent"
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
        <h2 className="text-2xl font-bold text-fg">対策ノート一覧</h2>
        <button
          onClick={onCreateNew}
          className="px-4 py-2 bg-action text-white rounded-lg hover:bg-action-hover transition focus:outline-none focus:ring-2 focus:ring-accent"
          aria-label="新規ノート作成"
        >
          新規ノート作成
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="flex items-center justify-center h-64 bg-surface rounded-lg border-2 border-dashed border-line-strong">
          <div className="text-center">
            <p className="text-fg-muted text-lg">ノートがありません</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} onClick={onNoteClick} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * NoteCardコンポーネント
 *
 * 個別ノートのカード表示
 * 要件: 1
 *
 * パフォーマンス最適化:
 * - React.memoでメモ化（propsが変わらない限り再レンダリングしない）
 */

import { memo } from 'react';
import { ChampionNote } from '@/types/note';
import { getChampionById } from '@/lib/utils/championHelpers';
import { formatDate } from '@/lib/utils/dateHelpers';

interface NoteCardProps {
  note: ChampionNote;
  onClick?: (noteId: number) => void;
}

function NoteCard({ note, onClick }: NoteCardProps) {
  const myChampion = getChampionById(note.my_champion_id);
  const enemyChampion = getChampionById(note.enemy_champion_id);

  const handleClick = () => {
    if (onClick) {
      onClick(note.id);
    }
  };

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-4 transition-all duration-150 cursor-pointer hover:shadow-md hover:ring-2 hover:ring-pink-300"
      onClick={handleClick}
    >
      {/* チャンピオンアイコン */}
      <div className="flex items-center gap-3 mb-3">
        {myChampion && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={myChampion.imagePath}
            alt={myChampion.name}
            className="w-8 h-8 rounded-full"
            width={32}
            height={32}
            loading="lazy"
          />
        )}
        <span className="text-gray-400">vs</span>
        {enemyChampion && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={enemyChampion.imagePath}
            alt={enemyChampion.name}
            className="w-8 h-8 rounded-full"
            width={32}
            height={32}
            loading="lazy"
          />
        )}
      </div>

      {/* プリセット名 */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {note.preset_name}
      </h3>

      {/* 日時情報 */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>作成: {formatDate(note.created_at)}</p>
        <p>更新: {formatDate(note.updated_at)}</p>
      </div>
    </div>
  );
}

// React.memoでメモ化してパフォーマンス最適化
export default memo(NoteCard);

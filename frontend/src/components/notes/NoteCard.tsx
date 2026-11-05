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

  return (
    <div
      className="bg-surface rounded-lg border border-line p-3 transition-all duration-150 cursor-pointer hover:ring-2 hover:ring-accent/60 flex items-center gap-3"
      onClick={() => onClick?.(note.id)}
    >
      {/* チャンピオンアイコン */}
      <div className="flex items-center gap-1 shrink-0">
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
        <span className="text-fg-subtle text-xs">vs</span>
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
      <p className="flex-1 text-sm font-semibold text-fg truncate">
        {note.preset_name}
      </p>

      {/* 更新日時 */}
      <span className="text-xs text-fg-subtle shrink-0">
        {formatDate(note.updated_at)}
      </span>
    </div>
  );
}

// React.memoでメモ化してパフォーマンス最適化
export default memo(NoteCard);

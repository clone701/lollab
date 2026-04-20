'use client';

import { useState, useEffect } from 'react';
import { ChampionNote } from '@/types/note';
import { getAllNotes } from '@/adapters/supabase/notes';
import { getChampionById } from '@/lib/utils/championHelpers';
import { formatDate } from '@/lib/utils/dateHelpers';
import Image from 'next/image';

interface AllNotesViewProps {
  onNoteClick: (note: ChampionNote) => void;
}

const PAGE_SIZE = 10;

export function AllNotesView({ onNoteClick }: AllNotesViewProps) {
  const [notes, setNotes] = useState<ChampionNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => {
    getAllNotes()
      .then(setNotes)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-800" />
      </div>
    );

  if (notes.length === 0)
    return (
      <div className="flex items-center justify-center h-64 text-center text-gray-500">
        <div>
          <p className="text-lg mb-2">チャンピオンを選択してください</p>
          <p className="text-sm">
            左のパネルで自分と相手のチャンピオンを選択してください
          </p>
        </div>
      </div>
    );

  const totalPages = Math.ceil(notes.length / PAGE_SIZE);
  const paged = notes.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">対策ノート一覧</h2>
      <div className="space-y-2">
        {paged.map((note) => {
          const my = getChampionById(note.my_champion_id);
          const enemy = getChampionById(note.enemy_champion_id);
          return (
            <button
              key={note.id}
              type="button"
              onClick={() => onNoteClick(note)}
              className="w-full text-left flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:ring-2 hover:ring-blue-400 transition-colors duration-150"
            >
              <div className="flex items-center gap-1 shrink-0">
                {my && (
                  <Image
                    src={my.imagePath}
                    alt={my.name}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                )}
                <span className="text-gray-400 text-xs">vs</span>
                {enemy && (
                  <Image
                    src={enemy.imagePath}
                    alt={enemy.name}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-800 truncate">
                  {note.preset_name}
                </p>
                {note.memo && (
                  <p className="text-xs text-gray-500 truncate">{note.memo}</p>
                )}
              </div>
              <span className="text-xs text-gray-400 shrink-0">
                {formatDate(note.updated_at)}
              </span>
            </button>
          );
        })}
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 text-sm bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-40 transition-colors duration-150"
          >
            前へ
          </button>
          <span className="px-3 py-1 text-sm text-gray-600">
            {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="px-3 py-1.5 text-sm bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-40 transition-colors duration-150"
          >
            次へ
          </button>
        </div>
      )}
    </div>
  );
}

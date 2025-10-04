'use client';

import { useState } from 'react';
import NotesTabBar from '../components/NotesTabBar';
import NewNoteForm from '../components/NewNoteForm';

export default function NotesNewPage() {
  const [mode, setMode] = useState<'select' | 'champion'>('select');

  return (
    <div className="py-10">
      <NotesTabBar />
      {mode === 'select' ? (
        <div className="flex flex-col md:flex-row gap-8 py-8">
          {/* 左パネル */}
          <div className="bg-white rounded-xl border border-[var(--border)] p-6 w-full max-w-md flex flex-col gap-4">
            <div className="font-semibold mb-2">ノートの種類を選択</div>
            <button
              className="text-left border rounded-lg p-4 mb-2 bg-gray-50 hover:bg-gray-100"
              disabled
            >
              <div className="font-medium">汎用ノート</div>
              <div className="text-xs text-gray-500">タイトルと内容を自由に記録できるノートです</div>
            </button>
            <button
              className="text-left border rounded-lg p-4 bg-gray-50 hover:bg-blue-50"
              onClick={() => setMode('champion')}
            >
              <div className="font-medium">チャンピオン対策</div>
              <div className="text-xs text-gray-500">特定のチャンピオン対戦に特化した対策ノートです</div>
            </button>
          </div>
          {/* 右パネル */}
          <div className="flex-1 flex items-center justify-center min-h-[200px] border border-[var(--border)] bg-white rounded-xl">
            <span className="text-gray-400 text-lg text-center">
              ノートの種類を選択してください。<br />
              左のパネルから汎用ノートまたはチャンピオン対策を選択してください。
            </span>
          </div>
        </div>
      ) : (
        <NewNoteForm />
      )}
    </div>
  );
}
'use client';

import Image from 'next/image';
import React from 'react';
import type { Champion } from '@/lib/champions';

type Props = {
  title?: string;
  myChampion: Champion | null;
  enemyChampion: Champion | null;
  selecting: 'me' | 'enemy' | null;
  setSelecting: (v: 'me' | 'enemy' | null) => void;
  search: string;
  setSearch: (s: string) => void;
  recent: Champion[];
  filtered: Champion[];
  onSelect: (champ: Champion) => void;
  onReset: () => void;
  onCreate?: () => void;
  maxListHeight?: number;
};

export default function ChampionPickerPanel({
  title = '新規ノート作成',
  myChampion,
  enemyChampion,
  selecting,
  setSelecting,
  search,
  setSearch,
  recent,
  filtered,
  onSelect,
  onReset,
  onCreate,
  maxListHeight = 240,
}: Props) {
  return (
    <div className="bg-white rounded-xl border border-[var(--border)] p-6 w-full max-w-xs flex flex-col gap-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold">{title}</span>
        </div>
        <hr />
      </div>

      <div className="flex flex-col gap-2 mt-4">
        {/* 自分 */}
        <div className="flex items-center gap-2 bg-blue-50 rounded px-2 py-2">
          {myChampion ? (
            <>
              <Image
                src={myChampion.icon}
                alt={myChampion.name}
                width={32}
                height={32}
                className="rounded-full"
              />
              <div className="flex-1">
                <div className="text-xs text-gray-500">自分</div>
                <div className="font-semibold">{myChampion.name}</div>
              </div>
              <button
                className="text-xs text-blue-600 underline"
                onClick={() => {
                  setSelecting('me');
                  setSearch('');
                }}
              >
                変更
              </button>
            </>
          ) : (
            <button className="flex-1 text-left text-gray-400" onClick={() => setSelecting('me')}>
              自分のチャンピオンを選択
            </button>
          )}
        </div>

        {/* 相手 */}
        <div className="flex items-center gap-2 bg-red-50 rounded px-2 py-2">
          {enemyChampion ? (
            <>
              <Image
                src={enemyChampion.icon}
                alt={enemyChampion.name}
                width={32}
                height={32}
                className="rounded-full"
              />
              <div className="flex-1">
                <div className="text-xs text-gray-500">相手</div>
                <div className="font-semibold">{enemyChampion.name}</div>
              </div>
              <button
                className="text-xs text-blue-600 underline"
                onClick={() => {
                  setSelecting('enemy');
                  setSearch('');
                }}
              >
                変更
              </button>
            </>
          ) : (
            <button className="flex-1 text-left text-gray-400" onClick={() => setSelecting('enemy')}>
              相手のチャンピオンを選択
            </button>
          )}
        </div>
      </div>

      {/* チャンピオン選択UI */}
      {selecting && (
        <>
          <input
            className="mb-2 px-3 py-2 border border-gray-200 rounded w-full text-sm transition-colors duration-150 hover:border-gray-300 focus:outline-none focus:ring-0 focus:border-gray-300"
            placeholder="チャンピオン名で検索..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
          {recent.length > 0 && (
            <div className="mb-2">
              <div className="text-xs text-gray-500 mb-2">よく使うチャンピオン</div>

              {/* 横スクロールで1行に収める */}
              <div
                className="flex gap-3 overflow-x-auto pb-1"
                style={{ WebkitOverflowScrolling: 'touch' }}
                aria-hidden={recent.length === 0}
              >
                {recent.slice(0, 5).map(champ => (
                  <button
                    key={champ.id}
                    className="flex-shrink-0 w-16 flex flex-col items-center gap-1 p-1 rounded hover:bg-gray-100"
                    onClick={() => onSelect(champ)}
                    type="button"
                    title={champ.name}
                  >
                    <Image
                      src={champ.icon}
                      alt={champ.name}
                      width={32}
                      height={32}
                      className="w-10 h-10 rounded-full bg-gray-100 object-cover"
                    />
                    <span className="text-xs truncate w-full text-center">{champ.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 全チャンピオン見出し */}
          <div className="text-xs text-gray-500 mb-2">チャンピオン一覧</div>

          {/* 修正: maxHeight の参照ミスを修正 */}
          <div className="overflow-y-auto" style={{ maxHeight: maxListHeight }}>
            <div className="flex flex-col gap-2">
              {filtered.map(champ => (
                <button
                  key={champ.key}
                  className="flex items-center gap-2 p-2 rounded hover:bg-gray-100"
                  onClick={() => onSelect(champ)}
                  type="button"
                >
                  <Image
                    src={champ.icon}
                    alt={champ.name}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full bg-gray-100 object-cover"
                  />
                  <span className="text-xs font-medium">{champ.name}</span>
                  <span className="ml-auto text-xs text-gray-400">{champ.id}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ボタン */}
      {!selecting && myChampion && enemyChampion && (
        <div className="flex gap-2 mt-4">
          <button
            className="flex-1 border rounded px-4 py-2 text-gray-700 bg-white hover:bg-gray-100"
            onClick={onReset}
          >
            リセット
          </button>
        </div>
      )}
    </div>
  );
}
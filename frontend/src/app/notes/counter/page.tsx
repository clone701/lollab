'use client';

import { useState, useEffect } from 'react';

type Champion = {
  key: string;
  id: string;
  name: string;
};

export default function ChampionSelectPage() {
  const [champions, setChampions] = useState<Champion[]>([]);
  const [search, setSearch] = useState('');
  const [selecting, setSelecting] = useState<'me' | 'enemy' | null>('me');
  const [myChampion, setMyChampion] = useState<Champion | null>(null);
  const [enemyChampion, setEnemyChampion] = useState<Champion | null>(null);

  useEffect(() => {
    fetch('https://ddragon.leagueoflegends.com/cdn/14.10.1/data/ja_JP/champion.json')
      .then(res => res.json())
      .then(data => setChampions(Object.values(data.data)));
  }, []);

  const filteredChampions = champions.filter(c =>
    c.name.includes(search) || c.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="flex gap-8 mb-8">
        {/* 自分のチャンピオン */}
        <div className="flex flex-col items-center">
          <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded font-semibold mb-2">
            自分
          </div>
          {myChampion ? (
            <div className="flex flex-col items-center">
              <img
                src={`https://ddragon.leagueoflegends.com/cdn/14.10.1/img/champion/${myChampion.id}.png`}
                alt={myChampion.name}
                className="w-16 h-16 rounded-full mb-2"
              />
              <div className="font-bold">{myChampion.name}</div>
              <button
                className="mt-2 text-xs text-blue-500 underline"
                onClick={() => setSelecting('me')}
              >
                変更する
              </button>
            </div>
          ) : (
            <button
              className="bg-blue-100 px-4 py-2 rounded"
              onClick={() => setSelecting('me')}
            >
              チャンピオンを選択
            </button>
          )}
        </div>
        {/* 相手のチャンピオン */}
        <div className="flex flex-col items-center">
          <div className="bg-red-50 text-red-700 px-4 py-2 rounded font-semibold mb-2">
            相手
          </div>
          {enemyChampion ? (
            <div className="flex flex-col items-center">
              <img
                src={`https://ddragon.leagueoflegends.com/cdn/14.10.1/img/champion/${enemyChampion.id}.png`}
                alt={enemyChampion.name}
                className="w-16 h-16 rounded-full mb-2"
              />
              <div className="font-bold">{enemyChampion.name}</div>
              <button
                className="mt-2 text-xs text-red-500 underline"
                onClick={() => setSelecting('enemy')}
              >
                変更する
              </button>
            </div>
          ) : (
            <button
              className="bg-red-100 px-4 py-2 rounded"
              onClick={() => setSelecting('enemy')}
            >
              チャンピオンを選択
            </button>
          )}
        </div>
      </div>
      {/* 選択モーダル */}
      {selecting && (
        <div className="bg-white border rounded shadow p-6 w-full max-w-lg">
          <div className="mb-2 font-semibold">
            {selecting === 'me' ? '自分のチャンピオンを選択' : '相手のチャンピオンを選択'}
          </div>
          <input
            type="text"
            placeholder="チャンピオン名で検索..."
            className="w-full px-3 py-2 border rounded mb-4"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto">
            {filteredChampions.map(c => (
              <button
                key={c.id}
                className="flex flex-col items-center p-2 rounded hover:bg-gray-100"
                onClick={() => {
                  if (selecting === 'me') setMyChampion(c);
                  else setEnemyChampion(c);
                  setSelecting(null);
                  setSearch('');
                }}
              >
                <img
                  src={`https://ddragon.leagueoflegends.com/cdn/14.10.1/img/champion/${c.id}.png`}
                  alt={c.name}
                  className="w-10 h-10 rounded-full mb-1"
                />
                <span className="text-xs">{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {/* ここにノート作成フォームや詳細表示を追加 */}
    </div>
  );
}
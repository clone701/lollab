'use client';

import { useState, useEffect } from 'react';

// 最近よく選ぶチャンピオンをlocalStorageから取得・保存
function getRecentChampions(): any[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('recentChampions') || '[]');
  } catch {
    return [];
  }
}
function addRecentChampion(champ: any) {
  if (typeof window === 'undefined') return;
  let recents = getRecentChampions();
  recents = recents.filter((c) => c.id !== champ.id);
  recents.unshift(champ);
  if (recents.length > 8) recents = recents.slice(0, 8);
  localStorage.setItem('recentChampions', JSON.stringify(recents));
}

export default function ChampionSelectModal({ open, onClose, onSelect }: {
  open: boolean;
  onClose: () => void;
  onSelect: (champion: { key: string; name: string; id: string }) => void;
}) {
  const [champions, setChampions] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    if (!open) return;
    fetch('https://ddragon.leagueoflegends.com/cdn/14.10.1/data/ja_JP/champion.json')
      .then(res => res.json())
      .then(data => setChampions(Object.values(data.data)));
    setRecent(getRecentChampions());
  }, [open]);

  const filtered = champions.filter((c) =>
    c.name.includes(search) || c.id.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (champ: any) => {
    addRecentChampion(champ);
    setRecent(getRecentChampions());
    onSelect(champ);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl p-6 w-[400px] max-h-[90vh] flex flex-col shadow-lg relative">
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-bold">チャンピオン選択</div>
          <button onClick={onClose} className="text-2xl text-gray-400 hover:text-gray-600">&times;</button>
        </div>
        <input
          className="mb-4 px-3 py-2 border rounded w-full text-sm"
          placeholder="チャンピオンを検索..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {/* 最近よく選ぶチャンピオン */}
        {recent.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-gray-500 mb-1">最近よく選ぶチャンピオン</div>
            <div className="flex flex-wrap gap-2">
              {recent.map((champ: any) => (
                <button
                  key={champ.id}
                  className="flex flex-col items-center gap-1 p-2 rounded hover:bg-gray-100"
                  onClick={() => handleSelect(champ)}
                  type="button"
                >
                  <img
                    src={`https://ddragon.leagueoflegends.com/cdn/14.10.1/img/champion/${champ.id}.png`}
                    alt={champ.name}
                    className="w-10 h-10 rounded-full bg-gray-100 object-cover"
                  />
                  <span className="text-xs">{champ.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="overflow-y-auto grid grid-cols-4 gap-3 pr-2" style={{ maxHeight: 320 }}>
          {filtered.map((champ: any) => (
            <button
              key={champ.key}
              className="flex flex-col items-center gap-1 p-2 rounded hover:bg-gray-100"
              onClick={() => handleSelect(champ)}
              type="button"
            >
              <img
                src={`https://ddragon.leagueoflegends.com/cdn/14.10.1/img/champion/${champ.id}.png`}
                alt={champ.name}
                className="w-12 h-12 rounded-full bg-gray-100 object-cover"
              />
              <span className="text-xs font-semibold">{champ.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
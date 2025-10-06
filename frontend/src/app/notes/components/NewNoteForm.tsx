'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import ChampionNoteForm from './ChampionNoteForm';

type Champion = {
  key: string;
  id: string;
  name: string;
};

export default function NewNoteForm() {
  const [champions, setChampions] = useState<Champion[]>([]);
  const [search, setSearch] = useState('');
  const [recent, setRecent] = useState<Champion[]>([]);
  const [myChampion, setMyChampion] = useState<Champion | null>(null);
  const [enemyChampion, setEnemyChampion] = useState<Champion | null>(null);
  const [selecting, setSelecting] = useState<'me' | 'enemy' | null>('me');
  const [created, setCreated] = useState(false); // 追加

  useEffect(() => {
    fetch('https://ddragon.leagueoflegends.com/cdn/14.10.1/data/ja_JP/champion.json')
      .then(res => res.json())
      .then(data => setChampions(Object.values(data.data)));
    // よく使うチャンピオン（localStorageから取得、なければ空）
    if (typeof window !== 'undefined') {
      try {
        setRecent(JSON.parse(localStorage.getItem('recentChampions') || '[]'));
      } catch {
        setRecent([]);
      }
    }
  }, []);

  // 検索フィルタ
  const filtered = champions.filter(c =>
    c.name.includes(search) || c.id.toLowerCase().includes(search.toLowerCase())
  );

  // チャンピオン選択時
  const handleSelect = (champ: Champion) => {
    if (selecting === 'me') setMyChampion(champ);
    if (selecting === 'enemy') setEnemyChampion(champ);
    // よく使うチャンピオンに追加
    if (typeof window !== 'undefined') {
      let recents: Champion[] = [];
      try {
        recents = JSON.parse(localStorage.getItem('recentChampions') || '[]');
      } catch {}
      recents = recents.filter(c => c.id !== champ.id);
      recents.unshift(champ);
      if (recents.length > 8) recents = recents.slice(0, 8);
      localStorage.setItem('recentChampions', JSON.stringify(recents));
      setRecent(recents);
    }
    setSelecting(null);
  };

  // リセット
  const handleReset = () => {
    setMyChampion(null);
    setEnemyChampion(null);
    setSelecting('me');
    setSearch('');
  };

  // 新規ノート作成
  const handleCreate = () => {
    setCreated(true); // 画面遷移
  };

  if (created && myChampion && enemyChampion) {
    return (
      <ChampionNoteForm
        myChampion={myChampion}
        enemyChampion={enemyChampion}
      />
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-8 py-8">
      {/* 左パネル */}
      <div className="bg-white rounded-xl border border-[var(--border)] p-6 w-full max-w-xs flex flex-col gap-4">
        {/* VSエリア */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">チャンピオン対策ノート作成</span>
            <span className="text-xs text-gray-400 cursor-pointer">← 戻る</span>
          </div>
          <hr />
          <div className="flex flex-col gap-2 mt-4">
            {/* 自分 */}
            <div className="flex items-center gap-2 bg-blue-50 rounded px-2 py-2">
              {myChampion ? (
                <>
                  <Image
                    src={`https://ddragon.leagueoflegends.com/cdn/14.10.1/img/champion/${myChampion.id}.png`}
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
                <button
                  className="flex-1 text-left text-gray-400"
                  onClick={() => setSelecting('me')}
                >
                  自分のチャンピオンを選択
                </button>
              )}
            </div>
            {/* 相手 */}
            <div className="flex items-center gap-2 bg-red-50 rounded px-2 py-2">
              {enemyChampion ? (
                <>
                  <Image
                    src={`https://ddragon.leagueoflegends.com/cdn/14.10.1/img/champion/${enemyChampion.id}.png`}
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
                <button
                  className="flex-1 text-left text-gray-400"
                  onClick={() => setSelecting('enemy')}
                >
                  相手のチャンピオンを選択
                </button>
              )}
            </div>
          </div>
        </div>

        {/* チャンピオン選択UI */}
        {selecting && (
          <>
            <input
              className="mb-2 px-3 py-2 border rounded w-full text-sm"
              placeholder="チャンピオン名で検索..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
            {recent.length > 0 && (
              <div className="mb-2">
                <div className="text-xs text-gray-500 mb-1">よく使うチャンピオン</div>
                <div className="flex flex-wrap gap-2">
                  {recent.map(champ => (
                    <button
                      key={champ.id}
                      className="flex flex-col items-center gap-1 p-2 rounded hover:bg-gray-100"
                      onClick={() => handleSelect(champ)}
                      type="button"
                    >
                      <Image
                        src={`https://ddragon.leagueoflegends.com/cdn/14.10.1/img/champion/${champ.id}.png`}
                        alt={champ.name}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full bg-gray-100 object-cover"
                      />
                      <span className="text-xs">{champ.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="overflow-y-auto" style={{ maxHeight: 240 }}>
              <div className="flex flex-col gap-2">
                {filtered.map(champ => (
                  <button
                    key={champ.key}
                    className="flex items-center gap-2 p-2 rounded hover:bg-gray-100"
                    onClick={() => handleSelect(champ)}
                    type="button"
                  >
                    <Image
                      src={`https://ddragon.leagueoflegends.com/cdn/14.10.1/img/champion/${champ.id}.png`}
                      alt={champ.name}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full bg-gray-100 object-cover"
                    />
                    <span className="text-sm">{champ.name}</span>
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
              onClick={handleReset}
            >
              リセット
            </button>
            <button
              className="flex-1 rounded px-4 py-2 text-white bg-gray-800 hover:bg-gray-700"
              onClick={handleCreate}
            >
              作成
            </button>
          </div>
        )}
      </div>
      {/* 右パネル */}
      <div className="flex-1 flex items-center justify-center min-h-[200px] border border-[var(--border)] bg-white rounded-xl">
        <span className="text-gray-400 text-lg text-center">
          チャンピオンを選択してください。<br />
          左のパネルで自分のチャンピオンと相手のチャンピオンを選択してください。
        </span>
      </div>
    </div>
  );
}
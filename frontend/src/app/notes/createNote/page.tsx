'use client';

import { useEffect, useState } from 'react';
import NotesTabBar from '../components/NotesTabBar';
import CreateChampionNoteForm from '../components/CreateChampionNoteForm';
import ChampionPickerPanel from '../components/ChampionPickerPanel';
import { getLocalChampions, Champion } from '@/lib/champions';

export default function NotesNewPage() {
  const MAX_RECENTS = 5; // <- 最新5件に制限

  const [champions, setChampions] = useState<Champion[]>([]);
  const [search, setSearch] = useState('');
  const [recent, setRecent] = useState<Champion[]>([]);
  const [myChampion, setMyChampion] = useState<Champion | null>(null);
  const [enemyChampion, setEnemyChampion] = useState<Champion | null>(null);
  const [selecting, setSelecting] = useState<'me' | 'enemy' | null>('me');

  useEffect(() => {
    // lib に定義したローカルデータを使う
    getLocalChampions().then(setChampions);
    if (typeof window !== 'undefined') {
      try {
        const raw = JSON.parse(localStorage.getItem('recentChampions') || '[]') as Champion[];
        setRecent(raw.slice(0, MAX_RECENTS));
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
    if (typeof window !== 'undefined') {
      let recents: Champion[] = [];
      try {
        recents = JSON.parse(localStorage.getItem('recentChampions') || '[]');
      } catch {}
      recents = recents.filter(c => c.id !== champ.id);
      recents.unshift(champ);
      if (recents.length > MAX_RECENTS) recents = recents.slice(0, MAX_RECENTS);
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

  return (
    <div className="py-10">
      <NotesTabBar />
      <div className="flex flex-col md:flex-row gap-8 py-8">
        <ChampionPickerPanel
          title="新規ノート作成"
          myChampion={myChampion}
          enemyChampion={enemyChampion}
          selecting={selecting}
          setSelecting={setSelecting}
          search={search}
          setSearch={setSearch}
          recent={recent}
          filtered={filtered}
          onSelect={handleSelect}
          onReset={handleReset}
        />

        {/* 右パネル: フルフォーム（選択済みなら即表示。メモ側の保存/リセットは非表示） */}
        <div className="flex-1 flex items-start justify-center min-h-[400px] border border-[var(--border)] bg-white rounded-xl p-6">
          {myChampion && enemyChampion ? (
            <CreateChampionNoteForm
              myChampion={myChampion}
              enemyChampion={enemyChampion}
              initialNote={null}
              readOnly={false}
              showMemoControls={false}
            />
          ) : (
            <div className="text-gray-400 text-center">
              チャンピオンを選択するとここに作成フォームが表示されます。
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
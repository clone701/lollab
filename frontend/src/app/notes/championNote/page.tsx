'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import NotesTabBar from '../components/NotesTabBar';
import ChampionNoteForm from '../components/ChampionNoteForm';
import ChampionPickerPanel from '../components/ChampionPickerPanel';
import { RuneSelection } from '../components/RuneSelector';
import { Champion, CHAMPIONS } from '@/lib/champions';

// move type and converter out of component so it's stable for hooks
type ChampionNote = {
  id?: number | string;
  runes?: RuneSelection;
  spells?: string[];
  items?: string[];
  memo?: string;
  presetName?: string;
  [key: string]: unknown;
};

const toChampionNote = (raw: unknown): ChampionNote | undefined => {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  const note: ChampionNote = {};
  if ('id' in r) note.id = r['id'] as number | string;
  // simple runtime check and cast to RuneSelection
  if ('runes' in r && r['runes'] && typeof r['runes'] === 'object') note.runes = r['runes'] as RuneSelection;
  if ('spells' in r && Array.isArray(r['spells'])) note.spells = r['spells'] as string[];
  if ('items' in r && Array.isArray(r['items'])) note.items = r['items'] as string[];
  if ('memo' in r && typeof r['memo'] === 'string') note.memo = r['memo'] as string;
  if (typeof r['presetName'] === 'string') note.presetName = r['presetName'] as string;
  else if (typeof r['preset_name'] === 'string') note.presetName = r['preset_name'] as string;
  return note;
};

export default function ChampionCounterPage() {
  const MAX_RECENTS = 5; // <- 最新5件に制限

  // use CHAMPIONS directly to avoid unused setState warning
  const champions: Champion[] = CHAMPIONS;

  const [search, setSearch] = useState('');
  const [recent, setRecent] = useState<Champion[]>([]);
  const [myChampion, setMyChampion] = useState<Champion | null>(null);
  const [enemyChampion, setEnemyChampion] = useState<Champion | null>(null);
  const [selecting, setSelecting] = useState<'me' | 'enemy' | null>('me');
  const [created, setCreated] = useState(false);
  const [loadingShow, setLoadingShow] = useState(false);
  const [loadedNote, setLoadedNote] = useState<ChampionNote | null>(null);

  useEffect(() => {
    // CHAMPIONS を使う設計にしているなら外部 fetch を行わない想定
    if (typeof window !== 'undefined') {
      try {
        const raw = JSON.parse(localStorage.getItem('recentChampions') || '[]') as Champion[];
        setRecent(raw.slice(0, MAX_RECENTS));
      } catch {
        setRecent([]);
      }
    }
  }, []);

  // DB検索：my / enemy が揃ったら既存ノートを取得
  useEffect(() => {
    const controller = new AbortController();
    const fetchNote = async () => {
      if (!myChampion || !enemyChampion) return;
      if (typeof window === 'undefined') return;

      const userId = localStorage.getItem('user_id');
      if (!userId) {
        // user_id が無ければ取得待ち（ログインしていない等）-> 既存ノート検索はスキップ
        setLoadedNote(null);
        return;
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (!backendUrl) {
        console.warn('NEXT_PUBLIC_BACKEND_URL is not set');
        setLoadedNote(null);
        return;
      }

      setLoadingShow(true);
      try {
        const q = `user_id=${encodeURIComponent(userId)}&my_champion_id=${encodeURIComponent(
          myChampion.id
        )}&enemy_champion_id=${encodeURIComponent(enemyChampion.id)}`;
        const res = await fetch(`${backendUrl}/api/notes/champion_notes/get?${q}`, { signal: controller.signal });
        if (!res.ok) {
          console.error('ノート読み込み失敗:', await res.text());
          setLoadedNote(null);
          return;
        }
        const data = await res.json();
        const raw = Array.isArray(data) ? data[0] : data;
        const note = toChampionNote(raw);
        setLoadedNote(note ?? null);
      } catch (err: unknown) {
        // handle AbortError without using `any`
        if (typeof DOMException !== 'undefined' && err instanceof DOMException && err.name === 'AbortError') {
          // fetch was aborted, nothing to do
        } else {
          console.error(err);
          setLoadedNote(null);
        }
      } finally {
        setLoadingShow(false);
      }
    };

    fetchNote();
    return () => controller.abort();
  }, [myChampion, enemyChampion]);

  // case-insensitive search
  const filtered = champions.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.id.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (champ: Champion) => {
    if (selecting === 'me') setMyChampion(champ);
    if (selecting === 'enemy') setEnemyChampion(champ);

    if (typeof window !== 'undefined') {
      let recents: Champion[] = [];
      try { recents = JSON.parse(localStorage.getItem('recentChampions') || '[]'); } catch {}
      recents = recents.filter(c => c.id !== champ.id);
      recents.unshift(champ);
      if (recents.length > MAX_RECENTS) recents = recents.slice(0, MAX_RECENTS);
      localStorage.setItem('recentChampions', JSON.stringify(recents));
      setRecent(recents);
    }

    setSelecting(null);
  };

  const handleReset = () => {
    setMyChampion(null);
    setEnemyChampion(null);
    setSelecting('me');
    setSearch('');
    setLoadedNote(null);
  };

  // 「表示」ボタン（既存の作成ボタンは残す）
  if (created && myChampion && enemyChampion) {
    return (
      <div className="py-10">
        <NotesTabBar />
        <div className="py-8">
          <ChampionNoteForm myChampion={myChampion} enemyChampion={enemyChampion} />
        </div>
      </div>
    );
  }

  return (
    <div className="py-10">
      <NotesTabBar />
      <div className="flex flex-col md:flex-row gap-8 py-8">
        <ChampionPickerPanel
          title="チャンピオン対策ノート（表示）"
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
          onCreate={() => setCreated(true)}
        />
        {/* 右パネル */}
        <div className="flex-1 flex items-start justify-center min-h-[200px] border border-[var(--border)] bg-white rounded-xl p-6">
          {loadingShow ? (
            <div>読み込み中...</div>
          ) : myChampion && enemyChampion ? (
            loadedNote ? (
              // 取得したノートを読み取り専用フォームで表示
              <ChampionNoteForm
                myChampion={myChampion}
                enemyChampion={enemyChampion}
                initialNote={loadedNote}
                readOnly={true}
              />
            ) : (
              <div className="w-full">
                <div className="mb-4 text-center">
                  <div className="text-sm text-gray-500">選択中</div>
                  <div className="flex items-center justify-center gap-6 mt-3">
                    <div className="flex items-center gap-3">
                      <Image
                        src={`https://ddragon.leagueoflegends.com/cdn/14.10.1/img/champion/${myChampion.id}.png`}
                        alt={myChampion.name}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                      <div>
                        <div className="text-xs text-gray-500">自分</div>
                        <div className="font-semibold">{myChampion.name}</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">vs</div>
                    <div className="flex items-center gap-3">
                      <Image
                        src={`https://ddragon.leagueoflegends.com/cdn/14.10.1/img/champion/${enemyChampion.id}.png`}
                        alt={enemyChampion.name}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                      <div>
                        <div className="text-xs text-gray-500">相手</div>
                        <div className="font-semibold">{enemyChampion.name}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center text-gray-500">
                  該当するノートは見つかりませんでした。右下の「作成」から新規作成できます。
                </div>
              </div>
            )
          ) : (
            <span className="text-gray-400 text-lg text-center">
              チャンピオンを選択してください。<br />
              左のパネルで自分のチャンピオンと相手のチャンピオンを選択してください。
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
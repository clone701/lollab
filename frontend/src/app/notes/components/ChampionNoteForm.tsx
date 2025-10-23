'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import RuneSelector, { RuneSelection } from './RuneSelector';
import SummonerSpellPicker from './summoners/SummonerSpellPicker';
import { SUMMONER_SPELLS } from '@/lib/summonerSpells';
import { START_ITEMS } from '@/lib/items';

type Props = {
  myChampion: { id: string; name: string };
  enemyChampion: { id: string; name: string };
  initialNote?: {
    runes?: RuneSelection;
    spells?: string[];
    items?: string[];
    memo?: string;
    id?: number | string;
  } | null;
  readOnly?: boolean;
  showMemoControls?: boolean;
};

export default function ChampionNoteForm({
  myChampion,
  enemyChampion,
  initialNote = null,
  readOnly = false,
  showMemoControls = true,
}: Props) {
  const [preset, setPreset] = useState<number>(1);

  const defaultRunes: RuneSelection = {
    primaryPath: 8000,
    secondaryPath: 8100,
    keystone: null,
    primaryRunes: [],
    secondaryRunes: [],
    shards: [0, 0, 0],
  };

  const [selectedSpells, setSelectedSpells] = useState<string[]>(initialNote?.spells ?? []);
  const [selectedItems, setSelectedItems] = useState<string[]>(initialNote?.items ?? []);
  const [runes, setRunes] = useState<RuneSelection>(initialNote?.runes ?? defaultRunes);
  const [memo, setMemo] = useState<string>(initialNote?.memo ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialNote) {
      setSelectedSpells(initialNote.spells ?? []);
      setSelectedItems(initialNote.items ?? []);
      setRunes(initialNote.runes ?? defaultRunes);
      setMemo(initialNote.memo ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialNote]);

  const toggleSpell = (id: string) => {
    if (readOnly) return;
    setSelectedSpells(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : prev.length < 2 ? [...prev, id] : [prev[1], id]
    );
  };

  const toggleItem = (id: string) => {
    if (readOnly) return;
    setSelectedItems(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
  };

  const handleSave = async () => {
    if (readOnly) return;
    const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null;
    if (!userId) {
      alert('ユーザーIDが取得できません。ログインしてください。');
      return;
    }
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) {
      alert('バックエンドURLが未設定です。環境変数 NEXT_PUBLIC_BACKEND_URL を確認してください。');
      return;
    }

    const payload = {
      user_id: userId,
      my_champion_id: myChampion.id,
      enemy_champion_id: enemyChampion.id,
      runes,
      spells: selectedSpells,
      items: selectedItems,
      memo,
      preset,
    };

    try {
      setSaving(true);
      const res = await fetch(`${backendUrl}/api/notes/champion_notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        alert('ノートを保存しました');
      } else {
        const text = await res.text();
        console.error('保存エラー:', text);
        alert('ノートの保存に失敗しました');
      }
    } catch (err) {
      console.error(err);
      alert('保存中にエラーが発生しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* 左: compact champion card */}
      <div className="col-span-1 space-y-4">
        <div className="p-4 border rounded bg-white">
          <div className="text-sm font-medium mb-2">チャンピオン</div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 p-2 rounded bg-blue-50">
              <Image
                src={`https://ddragon.leagueoflegends.com/cdn/14.10.1/img/champion/${myChampion.id}.png`}
                alt={myChampion.name}
                width={40}
                height={40}
                className="rounded-full"
              />
              <div>
                <div className="text-xs text-gray-500">自分</div>
                <div className="font-medium">{myChampion.name}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2 rounded bg-red-50">
              <Image
                src={`https://ddragon.leagueoflegends.com/cdn/14.10.1/img/champion/${enemyChampion.id}.png`}
                alt={enemyChampion.name}
                width={40}
                height={40}
                className="rounded-full"
              />
              <div>
                <div className="text-xs text-gray-500">相手</div>
                <div className="font-medium">{enemyChampion.name}</div>
              </div>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <button className="px-3 py-1 bg-white border rounded text-sm">リセット</button>
            <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">新規ノート作成</button>
          </div>
        </div>

        <div className="p-4 border rounded bg-white">
          <div className="text-sm font-medium mb-2">プリセット</div>
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">#{preset}</div>
            <div>
              <select
                value={preset}
                onChange={e => setPreset(Number(e.target.value))}
                className="px-3 py-1 border rounded bg-white text-sm"
              >
                <option value={1}>プリセット1</option>
                <option value={2}>プリセット2</option>
                <option value={3}>プリセット3</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 中央: spells / items / runes */}
      <div className="col-span-3 md:col-span-2 space-y-4">
        <div className="p-4 border rounded bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium">サモナースペル（最大2つ）</div>
            <div className="text-xs text-gray-400">選択済み: {selectedSpells.length}/2</div>
          </div>
          <SummonerSpellPicker
            spells={SUMMONER_SPELLS}
            selectedIds={selectedSpells}
            onToggle={toggleSpell}
            readOnly={readOnly}
          />
        </div>

        <div className="p-4 border rounded bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium">初期アイテム</div>
            <div className="text-xs text-gray-400">選択済み: {selectedItems.length}</div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {START_ITEMS.map(it => {
              const active = selectedItems.includes(it.id);
              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => toggleItem(it.id)}
                  disabled={readOnly}
                  className={`flex flex-col items-center gap-1 p-3 rounded border transition ${
                    active ? 'border-black bg-gray-100' : 'bg-white'
                  }`}
                >
                  <Image src={it.icon} alt={it.name} width={44} height={44} />
                  <div className="text-xs text-center">{it.name}</div>
                  <div className="text-[11px] text-gray-400">{it.gold}g</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 border rounded bg-white">
          <div className="text-sm font-medium mb-3">ルーン</div>
          {!readOnly ? (
            <RuneSelector value={runes} onChange={v => setRunes(v)} />
          ) : (
            <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">{JSON.stringify(runes, null, 2)}</pre>
          )}
        </div>
      </div>

      {/* 右 / bottom: memo + save */}
      <div className="col-span-3 md:col-span-1 space-y-4">
        <div className="p-4 border rounded bg-white h-full flex flex-col">
          <div className="text-sm font-medium mb-2">対策メモ</div>
          <textarea
            value={memo}
            onChange={e => setMemo(e.target.value)}
            readOnly={readOnly}
            className="flex-1 w-full border rounded p-2 text-sm bg-white"
            placeholder="対策メモを入力"
          />

          <div className="mt-4 flex gap-2">
            {!readOnly && showMemoControls && (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (readOnly) return;
                setSelectedSpells([]);
                setSelectedItems([]);
                setRunes(defaultRunes);
                setMemo('');
              }}
              className="px-4 py-2 border rounded bg-white"
            >
              リセット
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
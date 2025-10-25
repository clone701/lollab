'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import RuneSelector, { RuneSelection } from './RuneSelector';
import SummonerSpellPicker from './summoners/SummonerSpellPicker';
import { SUMMONER_SPELLS } from '@/lib/summonerSpells';
import { START_ITEMS } from '@/lib/items';
import { Panel, BORDER_STYLE_1, itemBtnClass } from '@/components/ui/Panel';

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
  readOnly = true, // デフォルトで読み取り専用に（親から false を渡せば編集可）
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
      {/* 中央: spells / items / runes */}
      <div className="col-span-3 md:col-span-2 space-y-4">
        <Panel>
          <div className="mb-3">
            <div className="text-sm font-medium">サモナースペル</div>
          </div>
          <SummonerSpellPicker
            spells={SUMMONER_SPELLS}
            selectedIds={selectedSpells}
            onToggle={toggleSpell}
            readOnly={readOnly}
            mode="display"
          />
        </Panel>

        <Panel>
          <div className="mb-3">
            <div className="text-sm font-medium">初期アイテム</div>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {START_ITEMS.map(it => {
              const count = selectedItems.filter(i => i === it.id).length;
              const active = count > 0;
              // 操作は readOnly で無効化するが、見た目の薄化はしない
              const interactionDisabled = readOnly;
              const styleDisabled = false;
              const className = itemBtnClass({ active, disabled: styleDisabled });
              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => toggleItem(it.id)}
                  disabled={interactionDisabled}
                  aria-pressed={active}
                  className={className}
                >
                  <Image src={it.icon} alt={it.name} width={44} height={44} />
                  <div className={`text-xs text-center ${active ? 'text-pink-700' : ''}`}>{it.name}</div>
                  <div className={`text-[11px] ${active ? 'text-pink-700/90' : 'text-gray-400'}`}>{it.gold}g</div>
                  {count > 1 && (
                    <div className={`absolute top-1 right-1 text-[11px] px-1 rounded ${active ? 'bg-white text-black' : 'bg-black text-white'}`}>
                      x{count}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Panel>

        <div className={BORDER_STYLE_1}>
          <div className="text-sm font-medium mb-3">ルーン</div>
          <RuneSelector value={runes} onChange={v => setRunes(v)} readOnly={readOnly} />
        </div>

        <div className="p-4 border border-transparent rounded bg-white">
          <div className="text-sm font-medium mb-2">対策メモ</div>
          <textarea
            value={memo}
            onChange={e => setMemo(e.target.value)}
            readOnly={readOnly}
            placeholder="対策メモを入力"
            className="mb-2 px-3 py-2 border border-gray-200 rounded w-full text-sm transition-colors duration-150 hover:border-gray-300 focus:outline-none focus:ring-0 focus:border-gray-300 min-h-[120px] max-h-[320px] resize-vertical overflow-auto"
          />
        </div>
      </div>
    </div>
  );
}
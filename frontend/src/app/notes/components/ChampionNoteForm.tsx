'use client';

import { useState } from 'react';
import Image from 'next/image';
import RuneSelector, { RuneSelection } from './RuneSelector';

const SUMMONER_SPELLS = [
  { id: 'SummonerFlash', name: 'Flash' },
  { id: 'SummonerIgnite', name: 'Ignite' },
  { id: 'SummonerTeleport', name: 'Teleport' },
  { id: 'SummonerBarrier', name: 'Barrier' },
  { id: 'SummonerHeal', name: 'Heal' },
  { id: 'SummonerBoost', name: 'Cleanse' },
  { id: 'SummonerExhaust', name: 'Exhaust' },
  { id: 'SummonerHaste', name: 'Ghost' },
];

const START_ITEMS = [
  { id: '1056', name: "Doran's Ring", gold: 400 },
  { id: '1055', name: "Doran's Blade", gold: 450 },
  { id: '1054', name: "Doran's Shield", gold: 450 },
  { id: '2033', name: 'Corrupting Potion', gold: 500 },
  { id: '3010', name: 'Sapphire Crystal', gold: 350 },
  { id: '1036', name: 'Long Sword', gold: 350 },
  { id: '1029', name: 'Cloth Armor', gold: 300 },
  { id: '2003', name: 'Health Potion', gold: 50 },
];

export default function ChampionNoteForm({
  myChampion,
  enemyChampion,
}: {
  myChampion: { id: string; name: string };
  enemyChampion: { id: string; name: string };
}) {
  // プリセット番号
  const [preset, setPreset] = useState(1);

  // サモナースペル選択
  const [selectedSpells, setSelectedSpells] = useState<string[]>([]);

  // 初期アイテム選択
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // ルーン（ここでは省略、同様にstateで管理）
  const [runes, setRunes] = useState<RuneSelection>({
    primaryPath: 8100,
    secondaryPath: 8200,
    keystone: null,
    primaryRunes: [],
    secondaryRunes: [],
    shards: [],
  });

  // 対策メモ
  const [memo, setMemo] = useState('');

  // プリセット保存（ダミー）
  const handleSavePreset = () => {
    alert('プリセット保存（ダミー）');
  };

  // サモナースペル選択
  const toggleSpell = (id: string) => {
    setSelectedSpells(spells =>
      spells.includes(id)
        ? spells.filter(s => s !== id)
        : spells.length < 2
        ? [...spells, id]
        : [spells[1], id]
    );
  };

  // アイテム選択
  const toggleItem = (id: string) => {
    setSelectedItems(items =>
      items.includes(id)
        ? items.filter(i => i !== id)
        : [...items, id]
    );
  };

  // 追加: 保存ハンドラ
  const handleSave = async () => {
    const res = await fetch('http://localhost:8000/api/notes/champion_notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'ここにユーザーID', // next-authやsessionから取得
        my_champion_id: myChampion.id,
        enemy_champion_id: enemyChampion.id,
        runes,
        spells: selectedSpells,
        items: selectedItems,
        memo,
      }),
    });
    if (res.ok) {
      alert('ノートを保存しました');
      // 必要なら画面遷移やリセット
    } else {
      alert('保存に失敗しました');
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 py-8">
      {/* 左パネル（VS表示） */}
      <div className="w-full max-w-xs">
        <div className="bg-white rounded-xl border border-[var(--border)] p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 bg-blue-50 rounded px-2 py-2">
              <Image
                src={`https://ddragon.leagueoflegends.com/cdn/15.19.1/img/champion/${myChampion.id}.png`}
                alt={myChampion.name}
                width={32}
                height={32}
                className="rounded-full"
              />
              <div>
                <div className="text-xs text-gray-500">自分</div>
                <div className="font-semibold">{myChampion.name}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-red-50 rounded px-2 py-2">
              <Image
                src={`https://ddragon.leagueoflegends.com/cdn/15.19.1/img/champion/${enemyChampion.id}.png`}
                alt={enemyChampion.name}
                width={32}
                height={32}
                className="rounded-full"
              />
              <div>
                <div className="text-xs text-gray-500">相手</div>
                <div className="font-semibold">{enemyChampion.name}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* 右パネル（入力フォーム） */}
      <div className="flex-1 flex flex-col gap-6">
        {/* プリセット切り替え・保存 */}
        <div className="flex items-center gap-2">
          <span className="font-semibold">プリセット</span>
          <select
            className="border rounded px-2 py-1"
            value={preset}
            onChange={e => setPreset(Number(e.target.value))}
          >
            <option value={1}>プリセット1</option>
            <option value={2}>プリセット2</option>
          </select>
          <button
            className="ml-2 px-3 py-1 rounded bg-gray-100 border text-sm"
            onClick={handleSavePreset}
          >
            保存
          </button>
        </div>
        {/* サモナースペル */}
        <div>
          <div className="font-semibold mb-2">サモナースペル</div>
          <div className="grid grid-cols-4 gap-2">
            {SUMMONER_SPELLS.map(spell => (
              <button
                key={spell.id}
                className={`flex flex-col items-center border rounded p-2 ${
                  selectedSpells.includes(spell.id)
                    ? 'bg-blue-100 border-blue-400'
                    : 'bg-white'
                }`}
                onClick={() => toggleSpell(spell.id)}
                type="button"
              >
                <Image
                  src={`https://ddragon.leagueoflegends.com/cdn/15.19.1/img/spell/${spell.id}.png`}
                  alt={spell.name}
                  width={32}
                  height={32}
                />
                <span className="text-xs">{spell.name}</span>
              </button>
            ))}
          </div>
          <div className="text-xs text-gray-500 mt-1">選択済み: {selectedSpells.length}/2</div>
        </div>
        {/* 初期アイテム */}
        <div>
          <div className="font-semibold mb-2">初期アイテム</div>
          <div className="grid grid-cols-4 gap-2">
            {START_ITEMS.map(item => (
              <button
                key={item.id}
                className={`flex flex-col items-center border rounded p-2 ${
                  selectedItems.includes(item.id)
                    ? 'bg-blue-100 border-blue-400'
                    : 'bg-white'
                }`}
                onClick={() => toggleItem(item.id)}
                type="button"
              >
                <Image
                  src={`https://ddragon.leagueoflegends.com/cdn/15.19.1/img/item/${item.id}.png`}
                  alt={item.name}
                  width={32}
                  height={32}
                />
                <span className="text-xs">{item.name}</span>
                <span className="text-[10px] text-gray-400">{item.gold}G</span>
              </button>
            ))}
          </div>
        </div>
        {/* ルーン選択 */}
        <div>
          <div className="font-semibold mb-2">ルーン</div>
          <div className="bg-white border rounded p-4">
            <RuneSelector value={runes} onChange={setRunes} />
          </div>
        </div>
        {/* 対策メモ */}
        <div>
          <div className="font-semibold mb-2">対策メモ</div>
          <div className="bg-white border rounded p-4 flex flex-col gap-2">
            <textarea
              className="border rounded p-2 w-full text-sm"
              rows={8}
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="対策メモを入力してください"
            />
          </div>
        </div>
        {/* 保存ボタン 追加 */}
        <div className="flex justify-end">
          <button
            className="ml-2 px-3 py-1 rounded bg-blue-600 text-white"
            onClick={handleSave}
          >
            ノート保存
          </button>
        </div>
      </div>
    </div>
  );
}
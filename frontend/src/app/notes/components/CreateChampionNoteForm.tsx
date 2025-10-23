'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import RuneSelector, { RuneSelection } from './RuneSelector';
import SummonerSpellPicker from './summoners/SummonerSpellPicker';
import { SUMMONER_SPELLS } from '@/lib/summonerSpells';
import { START_ITEMS } from '@/lib/items';
import { CHAMPIONS } from '@/lib/champions';
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
    // presetName を将来使う可能性があるためオプションで
    presetName?: string;
  } | null;
  readOnly?: boolean;
};

export default function CreateChampionNoteForm({
  myChampion,
  enemyChampion,
  initialNote = null,
  readOnly = false,
}: Props) {
  // プリセット名（数値ではなく名前を入力して保存する仕様に変更）
  // デフォルトは "自分のキャラ VS 相手のキャラ"（props の name を使って初期化）
  const [presetName, setPresetName] = useState<string>(initialNote?.presetName ?? '');

  // プリセット保存中フラグ（プリセット保存 API 用）
  const [savingPreset, setSavingPreset] = useState(false);

  // ルーンのデフォルト値（型: RuneSelection）
  const defaultRunes: RuneSelection = {
    primaryPath: 8000,
    secondaryPath: 8100,
    keystone: null,
    primaryRunes: [],
    secondaryRunes: [],
    shards: [0, 0, 0],
  };

  // 選択状態（初期値は initialNote から復元可能）
  const [selectedSpells, setSelectedSpells] = useState<string[]>(initialNote?.spells ?? []);
  const [selectedItems, setSelectedItems] = useState<string[]>(initialNote?.items ?? []);
  const [runes, setRunes] = useState<RuneSelection>(initialNote?.runes ?? defaultRunes);
  const [memo, setMemo] = useState<string>(initialNote?.memo ?? '');
  // saving state removed (unused)

  // 選択アイテム合計の上限（ゴールド）
  const MAX_ITEM_GOLD = 500;

  // ヘルスポーション等（50g）の id をここで定義しておく（複数選択を許可）
  const STACKABLE_ITEM_ID = '2003'; // items.ts の Health Potion id

  // 選択中アイテムの合計ゴールドを計算
  const calcTotalGold = (items: string[]) =>
    items.reduce((sum, id) => sum + (START_ITEMS.find(it => it.id === id)?.gold || 0), 0);

  // アイテム選択の挙動:
  // - STACKABLE_ITEM_ID は複数回選択可能（配列に同 id を複数追加）
  // - それ以外は単一選択（既に選択済みなら解除）
  // - 選択すると合計ゴールドが MAX_ITEM_GOLD を超えないかをチェック
  const toggleItem = (id: string) => {
    if (readOnly) return;
    const item = START_ITEMS.find(it => it.id === id);
    if (!item) return;

    setSelectedItems(prev => {
      const currentTotal = calcTotalGold(prev);

      if (id === STACKABLE_ITEM_ID) {
        // スタック可能アイテムは複数追加可能だが合計が上限を超えないようにする
        if (currentTotal + item.gold > MAX_ITEM_GOLD) return prev;
        return [...prev, id];
      }

      // 非スタックアイテムは既に選択済みなら解除、未選択なら追加（上限チェック）
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      } else {
        if (currentTotal + item.gold > MAX_ITEM_GOLD) return prev;
        return [...prev, id];
      }
    });
  };

  // ユーティリティ: 指定アイテムの選択数を返す（スタック数表示用）
  const countSelected = (id: string) => selectedItems.filter(i => i === id).length;

  // 初期プリセット名を props の champion 名に基づいて設定（ただしユーザーがすでに入力していれば上書きしない）
  useEffect(() => {
    if (!presetName) {
      setPresetName(`${myChampion.name} VS ${enemyChampion.name}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myChampion, enemyChampion]);

  // initialNote が渡された場合に内部 state を初期化する
  useEffect(() => {
    if (initialNote) {
      setSelectedSpells(initialNote.spells ?? []);
      setSelectedItems(initialNote.items ?? []);
      setRunes(initialNote.runes ?? defaultRunes);
      setMemo(initialNote.memo ?? '');
      if (initialNote.presetName) setPresetName(initialNote.presetName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialNote]);

  // サモナースペルのトグル（最大2つ）
  const toggleSpell = (id: string) => {
    if (readOnly) return;
    setSelectedSpells(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : prev.length < 2 ? [...prev, id] : [prev[1], id]
    );
  };

  // プリセット名をバックエンドに保存する処理
  // - 保存先 API: /api/presets (仮) — 必要ならエンドポイントに合わせて変更してください
  // - payload にプリセット名・チャンピオン情報・現在の構成を含めて保存
  const handleSavePreset = async () => {
    if (readOnly) return;
    const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null;
    if (!userId) {
      alert('ユーザーIDが取得できません。ログインしてください。');
      return;
    }
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) {
      alert('バックエンドURLが未設定です。');
      return;
    }

    // backend 側の createChampionNotes エンドポイント（/api/notes/createChampionNotes）に合わせる
    // Supabase 側は champion_notes テーブルを扱っているため、create と同じスキーマで送る
    const payload = {
      user_id: userId,
      my_champion_id: myChampion.id,
      enemy_champion_id: enemyChampion.id,
      runes,
      spells: selectedSpells,
      items: selectedItems,
      memo: memo ?? '',
      // presetName はオプションで保存先があるなら backend で処理してください
      preset_name: presetName,
    };

    try {
      setSavingPreset(true);
      const res = await fetch(`${backendUrl}/api/notes/createChampionNotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        alert('プリセットを保存しました');
      } else {
        const text = await res.text();
        console.error('プリセット保存エラー:', res.status, text);
        alert('プリセットの保存に失敗しました');
      }
    } catch (err) {
      console.error(err);
      alert('プリセットの保存中にエラーが発生しました');
    } finally {
      setSavingPreset(false);
    }
  };

  // JSX: レイアウトを調整
  // 変更点:
  // 1) ルーンの下に「対策メモ」を表示（中央カラム内）。メモは縦スクロール可能にして長さによるはみ出し防止。
  // 2) メモ領域の下のリセットボタンは削除（不要とのこと）。
  // 3) プリセットはテキスト入力可能にして右側に「保存」ボタンを追加（handleSavePreset を呼ぶ）。
  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* 中央: spells / items / runes / memo（メモをルーンの下に移動） */}
      <div className="col-span-3 md:col-span-2 space-y-4">
        {/* プリセット入力（右側にプリセット保存ボタン） */}
        {/* プリセット名ラベルは上、入力欄と保存ボタンは同一行に並べる */}
        <div className="mb-2 px-3 py-2 border border-gray-200 rounded w-full text-sm transition-colors duration-150">
          <div className="text-sm font-medium mb-1">プリセット名</div>
          <div className="flex items-center gap-3">
            <input
              value={presetName}
              onChange={e => setPresetName(e.target.value)}
              placeholder={`${myChampion.name} VS ${enemyChampion.name}`}
              className="flex-1 h-10 px-3 border border-gray-200 rounded text-sm transition-colors duration-150 hover:border-gray-300 focus:outline-none focus:ring-0 focus:border-gray-300"
            />
            <button
              type="button"
              onClick={handleSavePreset}
              disabled={savingPreset || readOnly}
              className="h-10 px-4 bg-gray-800 text-white rounded"
            >
              {savingPreset ? '保存中...' : '保存'}
            </button>
          </div>
        </div>

        {/* サモナースペル */}
        <Panel>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium">サモナースペル</div>
            <button
              type="button"
              onClick={() => setSelectedSpells([])}
              disabled={readOnly || selectedSpells.length === 0}
              className="text-xs px-2 py-1 border border-gray-200 rounded bg-white text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
            >
              リセット
            </button>
          </div>
          <SummonerSpellPicker spells={SUMMONER_SPELLS} selectedIds={selectedSpells} onToggle={toggleSpell} readOnly={readOnly} />
        </Panel>
        
        {/* 初期アイテム */}
        <Panel>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium">初期アイテム</div>
            <button
              type="button"
              onClick={() => setSelectedItems([])}
              disabled={readOnly || selectedItems.length === 0}
              className="text-xs px-2 py-1 border border-gray-200 rounded bg-white text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
            >
              リセット
            </button>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {START_ITEMS.map(it => {
              const count = countSelected(it.id);
              const active = count > 0;
              const currentTotal = calcTotalGold(selectedItems);
              const willExceed = currentTotal + it.gold > MAX_ITEM_GOLD;
              // ボタンを無効化する条件:
              // - readOnly である
              // - 追加時に上限を超える（非スタックアイテムは既に選択済みでない場合）
              const disabled =
                readOnly ||
                (!active && willExceed) ||
                (it.id !== STACKABLE_ITEM_ID && active && false); // 非スタックの既選択は解除可能

              // Panel.tsx で定義したスタイルを使って見た目を統一
              const className = itemBtnClass({ active, disabled });

              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => toggleItem(it.id)}
                  disabled={disabled}
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

        {/* ルーン */}
        <div className={BORDER_STYLE_1}>
          <div className="text-sm font-medium mb-3">ルーン</div>
          {!readOnly ? <RuneSelector value={runes} onChange={v => setRunes(v)} /> : <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">{JSON.stringify(runes, null, 2)}</pre>}
        </div>

        {/* 対策メモ（ルーンの下に表示）
            - 長くなったらこのテキストエリアのみ縦スクロールするように max-h/overflow を指定 */}
        <div className="p-4 border border-transparent rounded bg-white">
          <div className="text-sm font-medium mb-2">対策メモ</div>
          <textarea
            value={memo}
            onChange={e => setMemo(e.target.value)}
            readOnly={readOnly}
            placeholder="対策メモを入力"
            className="mb-2 px-3 py-2 border border-gray-200 rounded w-full text-sm transition-colors duration-150 hover:border-gray-300 focus:outline-none focus:ring-0 focus:border-gray-300 min-h-[120px] max-h-[320px] resize-vertical overflow-auto"
          />
          {/* メモ領域下のリセットボタンは不要なので削除 */}
        </div>
      </div>

      {/* 右カラム:（必要に応じて今後コントロールを追加）
          - ここは空にしておくか、将来の統計表示などに使えます */}
      <div className="col-span-3 md:col-span-1 space-y-4" aria-hidden>
        {/* 左カラムに「ノートを保存」ボタンを残したのでここは空にしています */}
      </div>
    </div>
  );
}
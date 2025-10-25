import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  RUNE_PATHS,
  DOMINATION_KEYSTONES,
  DOMINATION_RUNES,
  PRECISION_KEYSTONES,
  PRECISION_RUNES,
  RESOLVE_KEYSTONES,
  RESOLVE_RUNES,
  SORCERY_KEYSTONES,
  SORCERY_RUNES,
  INSPIRATION_KEYSTONES,
  INSPIRATION_RUNES,
  SHARDS,
} from '@/lib/runeData';

export type RuneSelection = {
  primaryPath: number;
  secondaryPath: number;
  keystone: number | null;
  primaryRunes: number[];
  secondaryRunes: number[];
  shards: number[];
};

// パスIDからキーストーン・ルーンを取得する関数
const getKeystones = (pathId: number) => {
  switch (pathId) {
    case 8100: return DOMINATION_KEYSTONES;
    case 8000: return PRECISION_KEYSTONES;
    case 8400: return RESOLVE_KEYSTONES;
    case 8200: return SORCERY_KEYSTONES;
    case 8300: return INSPIRATION_KEYSTONES;
    default: return [];
  }
};
const getRunes = (pathId: number) => {
  switch (pathId) {
    case 8100: return DOMINATION_RUNES;
    case 8000: return PRECISION_RUNES;
    case 8400: return RESOLVE_RUNES;
    case 8200: return SORCERY_RUNES;
    case 8300: return INSPIRATION_RUNES;
    default: return [];
  }
};

export default function RuneSelector({
  value,
  onChange,
  readOnly = false,
}: {
  value: RuneSelection;
  onChange: (v: RuneSelection) => void;
  readOnly?: boolean;
}) {
  // ローカルで直近クリックされたカラム順を保持しておく（最後に押した列を末尾にする）
  // これを使って、ユニーク選択数が上限を超えた場合に「最後に選んだ列」を解除できるようにする
  const [secondaryOrder, setSecondaryOrder] = useState<number[]>([]);

  // value.secondaryRunes が外部から変わったときは order を同期（初期化）
  useEffect(() => {
    const order: number[] = [];
    (value.secondaryRunes || []).forEach((v, i) => {
      if (v != null && v !== 0) order.push(i);
    });
    setSecondaryOrder(order);
  }, [value.secondaryRunes]);

  // Primary Path
  const handlePrimaryPath = (id: number) => {
    onChange({ ...value, primaryPath: id, keystone: null, primaryRunes: [] });
  };

  // Keystone
  const handleKeystone = (id: number) => {
    onChange({ ...value, keystone: id });
  };

  // 通常ルーン
  const handlePrimaryRune = (row: number, id: number) => {
    const newRunes = [...(value.primaryRunes || [])];
    newRunes[row] = id;
    onChange({ ...value, primaryRunes: newRunes });
  };

  // Secondary Path
  const handleSecondaryPath = (id: number) => {
    // パス変更時は secondaryRunes をクリアし、クリック履歴もリセット
    setSecondaryOrder([]);
    onChange({ ...value, secondaryPath: id, secondaryRunes: [] });
  };

  // Secondaryルーン
  const handleSecondaryRune = (row: number, id: number) => {
    const newRunes = [...(value.secondaryRunes || [])];
    newRunes[row] = id;

    // 選択中のユニーク値数を確認
    const selected = newRunes.filter(v => v != null && v !== 0);
    const unique = Array.from(new Set(selected));

    // もしユニーク数が 2 を超えるなら、直近で選択された（＝secondaryOrder の末尾）列のうち
    // current row を除った「最後に選んだ列」を解除して、今選んだものを有効にする
    if (unique.length > 2) {
      // 現在の order を更新（既にある row は先に取り除いて、新しい row を末尾にする）
      let order = secondaryOrder.filter(r => r !== row);
      order.push(row);

      // 末尾の一つ前が「最後に選んだ列」になる（current row の手前）
      // 無ければ（保険で）最初に見つかる row を対象にする
      const idxToRemove = order.length >= 2 ? order[order.length - 2] : order.find(r => r !== row);

      if (idxToRemove !== undefined) {
        // 解除（未選択状態にする）
        newRunes[idxToRemove] = 0;
        // order から解除した列を除外（current row は既に末尾に残る）
        order = order.filter(r => r !== idxToRemove);
      }

      setSecondaryOrder(order);
      onChange({ ...value, secondaryRunes: newRunes });
      return;
    }

    // ユニーク数が上限内なら通常通り order を更新して state を流す
    let order = secondaryOrder.filter(r => r !== row);
    if (id != null && id !== 0) {
      order.push(row);
    } else {
      // クリックで解除した場合は order から除外
      order = order.filter(r => r !== row);
    }
    setSecondaryOrder(order);
    onChange({ ...value, secondaryRunes: newRunes });
  };

  // Shards
  const handleShard = (row: number, id: number) => {
    const newShards = [...value.shards];
    newShards[row] = id;
    onChange({ ...value, shards: newShards });
  };

  // パスごとのデータ取得
  const primaryKeystones = getKeystones(value.primaryPath);
  const primaryRunes = getRunes(value.primaryPath);
  const secondaryRunes = getRunes(value.secondaryPath);

  return (
    <div>
      <div className="flex gap-8">
        {/* Primary */}
        <div>
          <div className="font-semibold mb-1">Primary</div>
          <div className="flex gap-2 mb-2">
            {RUNE_PATHS.map(path => (
              <button
                key={path.id}
                className={`p-1 rounded ${value.primaryPath === path.id ? 'ring-2 ring-blue-400' : ''}`}
                onClick={() => !readOnly && handlePrimaryPath(path.id)}
                type="button"
                disabled={readOnly}
              >
                <Image src={path.icon} alt={path.name} width={36} height={36} />
              </button>
            ))}
          </div>
          {/* Keystone */}
          <div className="flex gap-2 mb-2">
            {primaryKeystones.map(rune => (
              <button
                key={rune.id}
                className={`p-1 rounded ${value.keystone === rune.id ? 'ring-2 ring-blue-400' : ''}`}
                onClick={() => !readOnly && handleKeystone(rune.id)}
                type="button"
                disabled={readOnly}
              >
                <Image src={rune.icon} alt={rune.name} width={36} height={36} />
              </button>
            ))}
          </div>
          {/* 通常ルーン */}
          {primaryRunes.map((row, i) => (
            <div key={i} className="flex gap-2 mb-2">
              {row.map(rune => (
                <button
                  key={rune.id}
                  className={`p-1 rounded ${value.primaryRunes[i] === rune.id ? 'ring-2 ring-blue-400' : ''}`}
                  onClick={() => !readOnly && handlePrimaryRune(i, rune.id)}
                  type="button"
                  disabled={readOnly}
                >
                  <Image src={rune.icon} alt={rune.name} width={32} height={32} />
                </button>
              ))}
            </div>
          ))}
        </div>
        {/* Secondary */}
        <div>
          <div className="font-semibold mb-1">Secondary</div>
          <div className="flex gap-2 mb-2">
            {RUNE_PATHS.filter(path => path.id !== value.primaryPath).map(path => (
              <button
                key={path.id}
                className={`p-1 rounded ${value.secondaryPath === path.id ? 'ring-2 ring-purple-400' : ''}`}
                onClick={() => !readOnly && handleSecondaryPath(path.id)}
                type="button"
                disabled={readOnly}
              >
                <Image src={path.icon} alt={path.name} width={36} height={36} />
              </button>
            ))}
          </div>
          {/* Secondaryルーン */}
          {secondaryRunes.map((row, i) => (
            <div key={i} className="flex gap-2 mb-2">
              {row.map(rune => (
                <button
                  key={rune.id}
                  className={`p-1 rounded ${value.secondaryRunes[i] === rune.id ? 'ring-2 ring-purple-400' : ''}`}
                  onClick={() => !readOnly && handleSecondaryRune(i, rune.id)}
                  type="button"
                  disabled={readOnly}
                >
                  <Image src={rune.icon} alt={rune.name} width={32} height={32} />
                </button>
              ))}
            </div>
          ))}
        </div>
        {/* Shards */}
        <div>
          <div className="font-semibold mb-1">Shards</div>
          {SHARDS.map((row, i) => (
            <div key={i} className="flex gap-2 mb-2">
              {row.map(shard => (
                <button
                  key={shard.id}
                  className={`p-1 rounded ${value.shards[i] === shard.id ? 'ring-2 ring-green-400' : ''}`}
                  onClick={() => !readOnly && handleShard(i, shard.id)}
                  type="button"
                  disabled={readOnly}
                >
                  <Image src={shard.icon} alt={shard.name} width={28} height={28} />
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
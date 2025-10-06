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
}: {
  value: RuneSelection;
  onChange: (v: RuneSelection) => void;
}) {
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
    onChange({ ...value, secondaryPath: id, secondaryRunes: [] });
  };

  // Secondaryルーン
  const handleSecondaryRune = (row: number, id: number) => {
    const newRunes = [...(value.secondaryRunes || [])];
    newRunes[row] = id;
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
                onClick={() => handlePrimaryPath(path.id)}
                type="button"
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
                onClick={() => handleKeystone(rune.id)}
                type="button"
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
                  onClick={() => handlePrimaryRune(i, rune.id)}
                  type="button"
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
                onClick={() => handleSecondaryPath(path.id)}
                type="button"
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
                  onClick={() => handleSecondaryRune(i, rune.id)}
                  type="button"
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
                  onClick={() => handleShard(i, shard.id)}
                  type="button"
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
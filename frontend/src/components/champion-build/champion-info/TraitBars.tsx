import type { DdragonChampionInfo } from '@/lib/game-data';

const MAX_TRAIT = 10;

const TRAITS = [
  { key: 'attack', label: '攻撃', barClass: 'bg-game-physical' },
  { key: 'defense', label: '防御', barClass: 'bg-game-heal' },
  { key: 'magic', label: '魔力', barClass: 'bg-game-magic' },
  { key: 'difficulty', label: '難易度', barClass: 'bg-game-status' },
] as const;

interface TraitBarsProps {
  /** Data Dragon の info（各 0〜10） */
  info: DdragonChampionInfo;
}

// 攻撃・防御・魔力・難易度の横棒。棒は role="meter" で値を読み上げる
export function TraitBars({ info }: TraitBarsProps) {
  return (
    <ul className="grid gap-2 md:grid-cols-2 md:gap-x-6">
      {TRAITS.map(({ key, label, barClass }) => (
        <li key={key} className="flex items-center gap-3 text-sm">
          <span className="w-14 shrink-0 text-fg-muted">{label}</span>
          <div
            role="meter"
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={MAX_TRAIT}
            aria-valuenow={info[key]}
            className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2"
          >
            <div
              className={`h-full rounded-full ${barClass}`}
              style={{ width: `${(info[key] / MAX_TRAIT) * 100}%` }}
            />
          </div>
          <span className="w-5 text-right text-fg">{info[key]}</span>
        </li>
      ))}
    </ul>
  );
}

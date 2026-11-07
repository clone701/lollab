import { BuildIcon } from '@/components/champion-build';
import {
  formatCs,
  formatGames,
  formatKda,
  formatKdaBreakdown,
  formatWinRate,
  getChampionLabel,
  getKdaClass,
  getWinRateClass,
} from '@/lib/champion-stats';
import { toChampionId } from '@/lib/match-detail';
import type { ChampionStatData } from '@/types/summoner';

interface ChampionStatRowProps {
  champion: ChampionStatData;
}

// 1チャンピオンの行（高さ 48px）。左: アイコン・名前・CS、中央: KDA・平均 K/D/A、右: 勝率・試合数。区切り線は親の divide-y が引く
export function ChampionStatRow({ champion }: ChampionStatRowProps) {
  const { championName, wins, losses, kda } = champion;
  const label = getChampionLabel(championName);
  return (
    <li className="flex h-12 items-center gap-2 px-1">
      <BuildIcon
        src={`/images/champion/${toChampionId(championName)}.png`}
        label={label}
        size={36}
        className="rounded-full"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-4 text-fg">
          {label}
        </p>
        <p className="truncate text-xs leading-4 text-fg-muted">
          {formatCs(champion.cs, champion.csPerMinute)}
        </p>
      </div>
      <div className="w-24 flex-shrink-0 whitespace-nowrap text-center">
        <p className={`text-sm font-medium leading-4 ${getKdaClass(kda)}`}>
          {formatKda(kda)}
        </p>
        <p className="text-xs leading-4 text-fg-muted">
          {formatKdaBreakdown(
            champion.kills,
            champion.deaths,
            champion.assists
          )}
        </p>
      </div>
      <div className="flex-shrink-0 whitespace-nowrap text-right">
        <p
          className={`text-sm font-medium leading-4 ${getWinRateClass(wins, losses)}`}
        >
          {formatWinRate(wins, losses)}
        </p>
        <p className="text-xs leading-4 text-fg-muted">
          {formatGames(wins, losses)}
        </p>
      </div>
    </li>
  );
}

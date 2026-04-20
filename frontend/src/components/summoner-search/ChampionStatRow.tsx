import Image from 'next/image';
import type { ChampionStatData } from '@/types/summoner';

interface ChampionStatRowProps {
  champion: ChampionStatData;
}

export default function ChampionStatRow({ champion }: ChampionStatRowProps) {
  const { championName, wins, losses, cs, kda } = champion;
  const totalGames = wins + losses;
  const winRatePct = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

  return (
    <li className="flex items-center gap-3 py-2">
      {/* チャンピオンアイコン */}
      <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
        <Image
          src={`/images/champion/${championName}.png`}
          alt={championName}
          width={40}
          height={40}
          className="object-cover"
        />
      </div>

      {/* 名前・CS・KDA */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-sm font-medium text-gray-800 truncate">
          {championName}
        </p>
        <p className="text-xs text-gray-500">
          CS {cs} · {kda.toFixed(1)} KDA
        </p>
        {/* プログレスバー */}
        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            data-testid="win-rate-bar"
            className="h-full bg-green-500 rounded-full"
            style={{ width: `${winRatePct}%` }}
          />
        </div>
      </div>

      {/* 勝敗・勝率 */}
      <div className="text-right flex-shrink-0 space-y-0.5">
        <p className="text-xs text-gray-600">
          {wins}勝 {losses}敗
        </p>
        <p className="text-xs font-semibold text-green-600">{winRatePct}%</p>
      </div>
    </li>
  );
}

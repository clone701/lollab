import type { ChampionStatData } from '@/types/summoner';
import ChampionStatRow from './ChampionStatRow';

interface ChampionStatsProps {
  champions: ChampionStatData[];
}

export default function ChampionStats({ champions }: ChampionStatsProps) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-bold text-fg">よく使うチャンピオン</h2>
      <ul className="flex flex-col divide-y divide-line">
        {champions.map((champion) => (
          <ChampionStatRow key={champion.championName} champion={champion} />
        ))}
      </ul>
    </section>
  );
}

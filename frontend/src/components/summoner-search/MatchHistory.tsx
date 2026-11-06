import type { MatchData, Region } from '@/types/summoner';
import MatchCard from './MatchCard';

interface MatchHistoryProps {
  matches: MatchData[];
  /** 検索したサモナーの PUUID */
  puuid: string;
  /** 検索中の region */
  region: Region;
}

export default function MatchHistory({
  matches,
  puuid,
  region,
}: MatchHistoryProps) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-bold text-fg">対戦履歴</h2>
      <ul className="flex flex-col gap-2">
        {matches.map((match) => (
          <li key={match.matchId}>
            <MatchCard match={match} puuid={puuid} region={region} />
          </li>
        ))}
      </ul>
    </section>
  );
}

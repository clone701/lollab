import type { MatchData } from '@/types/summoner';
import MatchCard from './MatchCard';

interface MatchHistoryProps {
  matches: MatchData[];
}

export default function MatchHistory({ matches }: MatchHistoryProps) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-bold text-gray-800">対戦履歴</h2>
      <ul className="flex flex-col gap-2">
        {matches.map((match) => (
          <li key={match.matchId}>
            <MatchCard match={match} />
          </li>
        ))}
      </ul>
    </section>
  );
}

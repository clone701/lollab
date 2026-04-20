import type { Region } from '@/types/summoner';
import {
  MOCK_SUMMONER,
  MOCK_MATCHES,
  MOCK_CHAMPION_STATS,
} from '@/lib/summoner-search';
import SummonerProfile from './SummonerProfile';
import MatchHistory from './MatchHistory';
import ChampionStats from './ChampionStats';

interface SearchResultPageProps {
  query: string;
  region: Region;
  onSearch: (query: string, region: Region) => void;
}

export default function SearchResultPage({
  query,
  region,
  onSearch,
}: SearchResultPageProps) {
  return (
    <main className="py-8 px-4">
      {/* ヘッダー */}
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <span className="font-bold text-gray-700 bg-gray-100 border border-gray-300 rounded px-2 py-0.5 text-xs">
          {region}
        </span>
        <span className="font-medium text-gray-800">{query}</span>
        <button
          type="button"
          onClick={() => onSearch('', region)}
          className="ml-2 text-blue-500 hover:underline text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          ← 戻る
        </button>
      </div>

      {/* 3カラムレイアウト */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummonerProfile summoner={MOCK_SUMMONER} />
        <MatchHistory matches={MOCK_MATCHES} />
        <ChampionStats champions={MOCK_CHAMPION_STATS} />
      </div>
    </main>
  );
}

import type { SummonerData } from '@/types/summoner';

interface SummonerProfileProps {
  summoner: SummonerData;
}

export default function SummonerProfile({ summoner }: SummonerProfileProps) {
  const { name, tagLine, level, rank, previousSeasonRank } = summoner;
  const totalGames = rank.wins + rank.losses;
  const winRate =
    totalGames > 0 ? ((rank.wins / totalGames) * 100).toFixed(1) : '0.0';
  const isHighWinRate = parseFloat(winRate) >= 50;

  return (
    <section className="flex flex-col gap-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* チャンピオンアイコン・名前・タグ・レベル */}
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl">
          🎮
        </div>
        <div>
          <p className="font-bold text-gray-800 text-base">{name}</p>
          <p className="text-sm text-gray-500">#{tagLine}</p>
          <p className="text-xs text-gray-500">Level {level}</p>
        </div>
      </div>

      {/* ランクバナー */}
      <div className="bg-gray-50 border border-gray-200 rounded p-3 space-y-1">
        <p className="text-xs text-gray-500">{rank.queueType}</p>
        <p className="font-bold text-gray-800">
          {rank.tier} {rank.rank}
        </p>
        <p className="text-sm text-gray-600">{rank.leaguePoints} LP</p>
      </div>

      {/* 勝率・勝敗数 */}
      <div className="space-y-1">
        <p
          className={`text-lg font-bold ${isHighWinRate ? 'text-green-600' : 'text-gray-800'}`}
        >
          {winRate}%
        </p>
        <p className="text-sm text-gray-600">
          {rank.wins}勝 {rank.losses}敗
        </p>
        <p className="text-xs text-gray-500">総試合数 {totalGames}</p>
      </div>

      {/* 前シーズン */}
      <div className="text-xs text-gray-500">
        前シーズン: {previousSeasonRank}
      </div>
    </section>
  );
}

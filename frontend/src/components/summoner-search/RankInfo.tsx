import type { RankData } from '@/types/summoner';

interface RankInfoProps {
  rank: RankData;
}

const QUEUE_TYPE_LABELS: Record<string, string> = {
  RANKED_SOLO_5x5: 'ソロランク',
  RANKED_FLEX_SR: 'フレックス',
};

function getRankImagePath(tier: string): string | null {
  const t = tier.toLowerCase();
  const valid = [
    'iron',
    'bronze',
    'silver',
    'gold',
    'platinum',
    'emerald',
    'diamond',
    'master',
    'grandmaster',
    'challenger',
  ];
  if (!valid.includes(t)) return null;
  return `/images/rank/${t}.png`;
}

// ランク情報セクション: よく使うチャンピオンの上に表示
export default function RankInfo({ rank }: RankInfoProps) {
  const totalGames = rank.wins + rank.losses;
  const winRate = ((rank.wins / totalGames) * 100).toFixed(1);
  const isHighWinRate = parseFloat(winRate) >= 50;
  const rankImagePath = getRankImagePath(rank.tier);
  const queueLabel = QUEUE_TYPE_LABELS[rank.queueType] || rank.queueType;

  return (
    <section className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      <p className="text-xs text-gray-500 mb-2">{queueLabel}</p>
      <div className="flex items-center gap-3">
        {rankImagePath && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={rankImagePath}
            alt={rank.tier}
            className="w-12 h-12 object-contain"
          />
        )}
        <div className="flex-1">
          <p className="font-bold text-gray-800">
            {rank.tier} {rank.rank}
          </p>
          <p className="text-sm text-gray-600">{rank.leaguePoints} LP</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">
            {rank.wins}勝 {rank.losses}敗
          </p>
          <p
            className={`text-sm font-bold ${isHighWinRate ? 'text-green-600' : 'text-gray-800'}`}
          >
            勝率 {winRate}%
          </p>
        </div>
      </div>
    </section>
  );
}

import type { SummonerData, RankPositionData } from '@/types/summoner';

interface SummonerProfileProps {
  summoner: SummonerData;
  rankPosition: RankPositionData | null;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  isLoggedIn: boolean;
}

const DDRAGON_VERSION = '15.10.1';

// プロフィールバー: アイコン・名前#タグ横並び・ランク順位%・お気に入りボタン
export default function SummonerProfile({
  summoner,
  rankPosition,
  isFavorite,
  onToggleFavorite,
  isLoggedIn,
}: SummonerProfileProps) {
  const { name, tagLine, level, profileIconId, rank } = summoner;
  const profileIconUrl = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/${profileIconId}.png`;

  return (
    <section className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* プロフィールアイコン */}
      <div className="relative w-14 h-14 flex-shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profileIconUrl}
          alt={`${name}のプロフィールアイコン`}
          className="w-14 h-14 rounded-full object-cover bg-gray-200"
        />
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-1.5 rounded-full">
          {level}
        </span>
      </div>

      {/* 名前・タグライン横並び + お気に入りボタン */}
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-gray-800 text-base">{name}</span>
          <span className="text-sm text-gray-500">#{tagLine}</span>
          <button
            type="button"
            onClick={onToggleFavorite}
            className={`ml-1 text-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded ${
              isFavorite
                ? 'text-yellow-400'
                : 'text-gray-300 hover:text-yellow-400'
            }`}
            aria-label={isFavorite ? 'お気に入り解除' : 'お気に入り追加'}
            title={!isLoggedIn ? 'ログインが必要です' : undefined}
          >
            {isFavorite ? '★' : '☆'}
          </button>
        </div>
        {/* ランク順位表示 */}
        {rankPosition && rankPosition.position > 0 && (
          <p className="text-xs text-gray-500">
            ソロランク {rankPosition.position}位 (上位 {rankPosition.topPercent}
            %)
          </p>
        )}
        {rank.tier !== 'UNRANKED' && rankPosition?.position === 0 && (
          <p className="text-xs text-gray-500">
            ソロランク (上位 {rankPosition.topPercent}%)
          </p>
        )}
      </div>
    </section>
  );
}

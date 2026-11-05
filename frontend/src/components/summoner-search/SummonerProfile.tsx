import type { SummonerData, RankPositionData } from '@/types/summoner';
import UpdateButton from './UpdateButton';

interface SummonerProfileProps {
  summoner: SummonerData;
  rankPosition: RankPositionData | null;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  isLoggedIn: boolean;
  isUpdating: boolean;
  onUpdate: () => void;
  updateError: string | null;
}

const DDRAGON_VERSION = '15.10.1';

// プロフィールバー: アイコン・名前#タグ横並び・ランク順位%・お気に入りボタン
export default function SummonerProfile({
  summoner,
  rankPosition,
  isFavorite,
  onToggleFavorite,
  isLoggedIn,
  isUpdating,
  onUpdate,
  updateError,
}: SummonerProfileProps) {
  const { name, tagLine, level, profileIconId, rank } = summoner;
  const profileIconUrl = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/${profileIconId}.png`;

  return (
    <section className="flex items-center gap-4 p-4 bg-surface border border-line rounded-lg shadow-sm">
      {/* プロフィールアイコン */}
      <div className="relative w-14 h-14 flex-shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profileIconUrl}
          alt={`${name}のプロフィールアイコン`}
          className="w-14 h-14 rounded-full object-cover bg-surface-2"
        />
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-action text-white text-[10px] px-1.5 rounded-full">
          {level}
        </span>
      </div>

      {/* 名前・タグライン横並び + お気に入りボタン */}
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-fg text-base">{name}</span>
          <span className="text-sm text-fg-muted">#{tagLine}</span>
          <button
            type="button"
            onClick={onToggleFavorite}
            className={`ml-1 text-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded ${
              isFavorite
                ? 'text-highlight'
                : 'text-fg-subtle hover:text-highlight'
            }`}
            aria-label={isFavorite ? 'お気に入り解除' : 'お気に入り追加'}
            title={!isLoggedIn ? 'ログインが必要です' : undefined}
          >
            {isFavorite ? '★' : '☆'}
          </button>
        </div>
        {/* ランク順位表示 */}
        {rankPosition && rankPosition.position > 0 && (
          <p className="text-xs text-fg-muted">
            ソロランク {rankPosition.position}位 (上位 {rankPosition.topPercent}
            %)
          </p>
        )}
        {rank.tier !== 'UNRANKED' && rankPosition?.position === 0 && (
          <p className="text-xs text-fg-muted">
            ソロランク (上位 {rankPosition.topPercent}%)
          </p>
        )}
      </div>

      {/* 更新ボタン・最終更新・更新エラー */}
      <div className="ml-auto flex flex-col items-end gap-1">
        <UpdateButton
          lastUpdatedAt={summoner.lastUpdatedAt}
          isUpdating={isUpdating}
          onUpdate={onUpdate}
        />
        {updateError && (
          <p role="alert" className="text-xs text-danger-fg">
            {updateError}
          </p>
        )}
      </div>
    </section>
  );
}

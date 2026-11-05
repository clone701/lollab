import Image from 'next/image';
import type { MatchData } from '@/types/summoner';
import { formatTimeAgo } from '@/lib/summoner-search';

interface MatchCardProps {
  match: MatchData;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function MatchCard({ match }: MatchCardProps) {
  const {
    isWin,
    gameMode,
    championName,
    kills,
    deaths,
    assists,
    cs,
    gameDurationSeconds,
    itemIds,
    timeAgoSeconds,
  } = match;

  const kda =
    deaths === 0 ? 'Perfect' : ((kills + assists) / deaths).toFixed(2) + ' KDA';

  return (
    <article
      className={`flex items-center gap-3 p-3 rounded-lg border ${
        isWin ? 'border-win/40 bg-win/15' : 'border-loss/40 bg-loss/15'
      }`}
    >
      {/* 勝敗ラベル */}
      <div
        className={`w-10 text-center text-xs font-bold rounded py-1 ${
          isWin ? 'bg-win text-canvas' : 'bg-loss text-canvas'
        }`}
      >
        {isWin ? '勝利' : '敗北'}
      </div>

      {/* チャンピオンアイコン */}
      <div className="w-10 h-10 rounded-full bg-surface-2 overflow-hidden flex-shrink-0">
        <Image
          src={`/images/champion/${championName}.png`}
          alt={championName}
          width={40}
          height={40}
          className="object-cover"
          onError={() => {}}
        />
      </div>

      {/* 中央情報 */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-xs text-fg-muted">{gameMode}</p>
        <p className="text-xs font-medium text-fg">
          {kills}/{deaths}/{assists} — {kda}
        </p>
        <p className="text-xs text-fg-muted">
          CS {cs} ({(cs / (gameDurationSeconds / 60)).toFixed(1)}) ·{' '}
          {formatDuration(gameDurationSeconds)}
        </p>
      </div>

      {/* アイテムアイコン */}
      <div className="flex gap-0.5 flex-wrap max-w-[80px]">
        {itemIds
          .slice(0, 6)
          .filter((id) => id !== 0)
          .map((id, i) => (
            <Image
              key={i}
              src={`/images/item/${id}.png`}
              alt={`item-${id}`}
              width={20}
              height={20}
              className="rounded"
            />
          ))}
      </div>

      {/* 右側 */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <p className="text-xs text-fg-subtle">
          {formatTimeAgo(timeAgoSeconds)}
        </p>
        <button
          type="button"
          aria-label="詳細を展開"
          className="text-fg-subtle hover:text-fg-muted text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          ▼
        </button>
      </div>
    </article>
  );
}

import Link from 'next/link';
import {
  buildParticipantSearchHref,
  formatRank,
  getDisplayName,
} from '@/lib/match-detail';
import type { ParticipantDetail } from '@/types/matchDetail';
import type { Region } from '@/types/summoner';

interface NameCellProps {
  participant: ParticipantDetail;
  /** 検索中の region（試合 ID の接頭辞ではなくこれをリンク先に使う） */
  region: Region;
}

// 名前（そのプレイヤーの検索結果へのリンク）と、分かっていればランク
export function NameCell({ participant: p, region }: NameCellProps) {
  const href = buildParticipantSearchHref(p, region);
  const name = getDisplayName(p);
  return (
    <div className="flex min-w-0 flex-col">
      {href ? (
        <Link
          href={href}
          title={`${name}#${p.riot_id_tagline}`}
          className="truncate text-sm font-medium text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {name}
        </Link>
      ) : (
        <span className="truncate text-sm text-fg-muted">{name}</span>
      )}
      {p.rank && (
        <span className="text-xs text-fg-subtle">{formatRank(p.rank)}</span>
      )}
    </div>
  );
}

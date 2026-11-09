import Link from 'next/link';
import { BuildIcon } from '@/components/champion-build';
import { getChampionLabel } from '@/lib/champion-stats';
import { buildMemberHref, getMemberName } from '@/lib/match-card';
import { toChampionId } from '@/lib/match-detail';
import type { MatchParticipantBrief, Region } from '@/types/summoner';

interface MatchMemberProps {
  member: MatchParticipantBrief;
  /** 検索したサモナーの PUUID（強調する） */
  targetPuuid: string;
  /** 検索中の region（リンク先に使う） */
  region: Region;
}

// 参加者1人: 小さいチャンピオンアイコンと名前（検索結果へのリンク。長い名前は省略）
export function MatchMember({ member, targetPuuid, region }: MatchMemberProps) {
  const href = buildMemberHref(member, region);
  const { name, fullName } = getMemberName(member);
  const tone =
    member.puuid === targetPuuid ? 'font-bold text-fg' : 'text-fg-muted';
  const className = `truncate text-xs ${tone}`;
  return (
    <li className="flex min-w-0 items-center gap-1">
      <BuildIcon
        src={`/images/champion/${toChampionId(member.championName)}.png`}
        label={getChampionLabel(member.championName)}
        size={16}
        className="flex-shrink-0 rounded"
      />
      {href ? (
        <Link
          href={href}
          title={fullName}
          className={`${className} hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent`}
        >
          {name}
        </Link>
      ) : (
        <span title={fullName} className={className}>
          {name}
        </span>
      )}
    </li>
  );
}

import { splitMatchTeams } from '@/lib/match-card';
import type { MatchParticipantBrief, Region } from '@/types/summoner';
import { MatchMember } from './MatchMember';

interface MatchParticipantsProps {
  participants: MatchParticipantBrief[];
  /** 検索したサモナーの PUUID */
  targetPuuid: string;
  /** 検索中の region */
  region: Region;
}

// 参加者: カードの右側に、左にブルー・右にレッドの2列（長い名前は省略する。カードの幅が足りないときは隠す）
export function MatchParticipants({
  participants,
  targetPuuid,
  region,
}: MatchParticipantsProps) {
  const { blue, red } = splitMatchTeams(participants);
  return (
    <div className="hidden min-w-40 flex-1 grid-cols-2 gap-x-2 @2xl:grid">
      {[blue, red].map((team, index) => (
        <ul key={index} className="flex min-w-0 flex-col">
          {team.map((member) => (
            <MatchMember
              key={member.puuid}
              member={member}
              targetPuuid={targetPuuid}
              region={region}
            />
          ))}
        </ul>
      ))}
    </div>
  );
}

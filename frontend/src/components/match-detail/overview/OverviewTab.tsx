import { TABLE_MIN_WIDTH_CLASS } from './columns';
import { calcDamageMax, splitTeams } from '@/lib/match-detail';
import type { MatchDetailResponse } from '@/types/matchDetail';
import type { Region } from '@/types/summoner';
import { TeamComparison } from './TeamComparison';
import { TeamTable } from './TeamTable';

interface OverviewTabProps {
  match: MatchDetailResponse;
  targetPuuid: string;
  region: Region;
}

// 概要: チームの比較と、勝利・敗北チームの表。表は狭い画面で横にスクロールする
export function OverviewTab({ match, targetPuuid, region }: OverviewTabProps) {
  const damageMax = calcDamageMax(match.participants);
  return (
    <div className="flex flex-col gap-3">
      <TeamComparison teams={match.teams} />
      <div className="overflow-x-auto">
        <div className={`flex flex-col gap-3 ${TABLE_MIN_WIDTH_CLASS}`}>
          {splitTeams(match).map((group) => (
            <TeamTable
              key={group.team.team_id}
              group={group}
              targetPuuid={targetPuuid}
              region={region}
              damageMax={damageMax}
              durationSeconds={match.game_duration}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

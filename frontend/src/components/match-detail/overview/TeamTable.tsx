import { teamName } from '@/lib/match-detail';
import type { DamageMax, TeamGroup } from '@/lib/match-detail';
import type { Region } from '@/types/summoner';
import { ColumnHeader } from './ColumnHeader';
import { ParticipantRow } from './ParticipantRow';

interface TeamTableProps {
  group: TeamGroup;
  targetPuuid: string;
  region: Region;
  damageMax: DamageMax;
  durationSeconds: number;
}

// 1チーム分: 勝敗とチームの色の見出し、5人の行
export function TeamTable({
  group,
  targetPuuid,
  region,
  damageMax,
  durationSeconds,
}: TeamTableProps) {
  const { team, participants } = group;
  return (
    <section
      aria-label={teamName(team.team_id)}
      className={`rounded-lg p-2 ${team.win ? 'bg-win/15' : 'bg-loss/15'}`}
    >
      <h3 className="mb-1 px-2 text-sm font-bold">
        <span className={team.win ? 'text-win' : 'text-loss'}>
          {team.win ? '勝利' : '敗北'}
        </span>
        <span className="ml-2 font-medium text-fg-muted">
          {teamName(team.team_id)}
        </span>
      </h3>
      <ColumnHeader />
      <ul className="flex flex-col gap-1">
        {participants.map((p) => (
          <ParticipantRow
            key={p.puuid}
            participant={p}
            isTarget={p.puuid === targetPuuid}
            region={region}
            damageMax={damageMax}
            durationSeconds={durationSeconds}
          />
        ))}
      </ul>
    </section>
  );
}

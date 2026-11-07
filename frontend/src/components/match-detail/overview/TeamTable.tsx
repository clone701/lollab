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

// 1チーム分: 勝敗とチームの色の見出し、人の行（細い区切り線で分ける）
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
      className={`rounded-lg px-2 py-1 ${team.win ? 'bg-win/15' : 'bg-loss/15'}`}
    >
      <h3 className="mb-0.5 px-2 text-sm font-bold">
        <span className={team.win ? 'text-win' : 'text-loss'}>
          {team.win ? '勝利' : '敗北'}
        </span>
        <span className="ml-2 font-medium text-fg-muted">
          {teamName(team.team_id)}
        </span>
      </h3>
      <ColumnHeader />
      <ul className="flex flex-col divide-y divide-line/50">
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

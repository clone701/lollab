import { teamName } from '@/lib/match-detail';
import type { TeamGroup } from '@/lib/match-detail';
import { PlayerButton } from './PlayerButton';

interface PlayerSelectorProps {
  groups: TeamGroup[];
  selectedPuuid: string;
  onSelect: (puuid: string) => void;
}

// 10人のチャンピオンのアイコン。押したプレイヤーのビルドに切り替える
export function PlayerSelector({
  groups,
  selectedPuuid,
  onSelect,
}: PlayerSelectorProps) {
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2">
      {groups.map(({ team, participants }) => (
        <div
          key={team.team_id}
          role="group"
          aria-label={teamName(team.team_id)}
          className="flex gap-1"
        >
          {participants.map((p) => (
            <PlayerButton
              key={p.puuid}
              participant={p}
              isSelected={p.puuid === selectedPuuid}
              onSelect={onSelect}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

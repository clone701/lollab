'use client';

import { useState } from 'react';
import { splitTeams } from '@/lib/match-detail';
import type { MatchDetailResponse } from '@/types/matchDetail';
import { BuildDetails } from './BuildDetails';
import { PlayerSelector } from './PlayerSelector';

interface BuildTabProps {
  match: MatchDetailResponse;
  targetPuuid: string;
}

// ビルド: 初期表示は対象プレイヤー。10人のアイコンで切り替える
export function BuildTab({ match, targetPuuid }: BuildTabProps) {
  const [selectedPuuid, setSelectedPuuid] = useState(targetPuuid);
  const groups = splitTeams(match);
  const participants = groups.flatMap((g) => g.participants);
  const current =
    participants.find((p) => p.puuid === selectedPuuid) ?? participants[0];
  if (!current) return null;
  return (
    <div className="flex flex-col gap-3">
      <PlayerSelector
        groups={groups}
        selectedPuuid={current.puuid}
        onSelect={setSelectedPuuid}
      />
      <BuildDetails participant={current} />
    </div>
  );
}

'use client';

import { useState } from 'react';
import { MatchDetailPanel } from '@/components/match-detail';
import type { MatchData, Region } from '@/types/summoner';
import {
  MatchCardSide,
  MatchChampionIcon,
  MatchItems,
  MatchResultBadge,
  MatchStats,
} from './match-card';

interface MatchCardProps {
  match: MatchData;
  /** 検索したサモナーの PUUID（試合詳細で対象プレイヤーを強調する） */
  puuid: string;
  /** 検索中の region（試合詳細の名前のリンク先に使う） */
  region: Region;
}

export default function MatchCard({ match, puuid, region }: MatchCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = `match-detail-${match.matchId}`;

  return (
    <div className="flex flex-col gap-2">
      <article
        className={`flex items-center gap-3 p-3 rounded-lg border ${
          match.isWin ? 'border-win/40 bg-win/15' : 'border-loss/40 bg-loss/15'
        }`}
      >
        <MatchResultBadge isWin={match.isWin} />
        <MatchChampionIcon championName={match.championName} />
        <MatchStats match={match} />
        <MatchItems itemIds={match.itemIds} />
        <MatchCardSide
          timeAgoSeconds={match.timeAgoSeconds}
          isOpen={isOpen}
          panelId={panelId}
          onToggle={() => setIsOpen((prev) => !prev)}
        />
      </article>
      {isOpen && (
        <MatchDetailPanel
          id={panelId}
          matchId={match.matchId}
          targetPuuid={puuid}
          region={region}
        />
      )}
    </div>
  );
}

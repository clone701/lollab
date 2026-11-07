'use client';

import { useState } from 'react';
import { MatchDetailPanel } from '@/components/match-detail';
import type { MatchData, Region } from '@/types/summoner';
import {
  ExpandButton,
  MatchBuild,
  MatchExtra,
  MatchInfo,
  MatchParticipants,
  MatchScore,
} from './match-card';

interface MatchCardProps {
  match: MatchData;
  /** 検索したサモナーの PUUID（参加者・試合詳細で対象プレイヤーを強調する） */
  puuid: string;
  /** 検索中の region（参加者・試合詳細の名前のリンク先に使う） */
  region: Region;
}

export default function MatchCard({ match, puuid, region }: MatchCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = `match-detail-${match.matchId}`;
  // リメイクは灰色、それ以外は勝敗の色
  const tone = match.isRemake
    ? 'border-line-strong bg-surface-2'
    : match.isWin
      ? 'border-win bg-win/15'
      : 'border-loss bg-loss/15';

  return (
    <div className="@container flex flex-col gap-2">
      <article
        className={`flex items-center gap-3 rounded-lg border-l-4 p-3 ${tone}`}
      >
        <MatchInfo match={match} />
        <MatchBuild match={match} />
        <MatchScore match={match} />
        <MatchExtra match={match} />
        <MatchParticipants
          participants={match.participants}
          targetPuuid={puuid}
          region={region}
        />
        <div className="ml-auto flex-shrink-0">
          <ExpandButton
            isOpen={isOpen}
            panelId={panelId}
            onToggle={() => setIsOpen((prev) => !prev)}
          />
        </div>
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

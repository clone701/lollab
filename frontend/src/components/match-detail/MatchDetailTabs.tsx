'use client';

import { useState } from 'react';
import { MATCH_DETAIL_TABS } from '@/lib/match-detail';
import type { MatchDetailTabId } from '@/lib/match-detail';
import type { MatchDetailResponse } from '@/types/matchDetail';
import type { Region } from '@/types/summoner';
import { BuildTab } from './build';
import { OverviewTab } from './overview';

interface MatchDetailTabsProps {
  match: MatchDetailResponse;
  targetPuuid: string;
  region: Region;
}

const TAB_BASE =
  'rounded px-4 py-2 text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent';

export function MatchDetailTabs({
  match,
  targetPuuid,
  region,
}: MatchDetailTabsProps) {
  const [active, setActive] = useState<MatchDetailTabId>('overview');
  return (
    <div className="flex flex-col gap-3">
      <div role="tablist" aria-label="試合詳細" className="flex gap-2">
        {MATCH_DETAIL_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            onClick={() => setActive(tab.id)}
            className={`${TAB_BASE} ${
              active === tab.id
                ? 'ring-2 ring-accent bg-accent/15 text-fg'
                : 'text-fg-muted hover:ring-2 hover:ring-accent/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {active === 'overview' ? (
          <OverviewTab
            match={match}
            targetPuuid={targetPuuid}
            region={region}
          />
        ) : (
          <BuildTab match={match} targetPuuid={targetPuuid} />
        )}
      </div>
    </div>
  );
}

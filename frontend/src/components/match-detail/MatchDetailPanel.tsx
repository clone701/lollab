'use client';

import type { Region } from '@/types/summoner';
import { MatchDetailError } from './MatchDetailError';
import { MatchDetailLoading } from './MatchDetailLoading';
import { MatchDetailTabs } from './MatchDetailTabs';
import { useMatchDetail } from './useMatchDetail';

interface MatchDetailPanelProps {
  /** 展開ボタンの aria-controls が指す ID */
  id: string;
  matchId: string;
  /** 検索したサモナーの PUUID（対象プレイヤー） */
  targetPuuid: string;
  /** 検索中の region（名前のリンク先に使う） */
  region: Region;
}

// カードの下に出す試合詳細。読み込み中・エラー（再試行）・タブを切り替える
export function MatchDetailPanel({
  id,
  matchId,
  targetPuuid,
  region,
}: MatchDetailPanelProps) {
  const { data, error, isLoading, retry } = useMatchDetail(matchId);
  return (
    <section
      id={id}
      aria-label="試合詳細"
      className="rounded-lg border border-line bg-surface p-3"
    >
      {isLoading && <MatchDetailLoading />}
      {error && <MatchDetailError message={error} onRetry={retry} />}
      {data && (
        <MatchDetailTabs
          match={data}
          targetPuuid={targetPuuid}
          region={region}
        />
      )}
    </section>
  );
}

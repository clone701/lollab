import {
  getPrimaryTreeRows,
  getShardRows,
  getSubTreeRows,
} from '@/lib/match-detail';
import type { ParticipantDetail } from '@/types/matchDetail';
import { RuneTree } from './RuneTree';

interface RuneTreeViewProps {
  participant: ParticipantDetail;
}

// メイン・サブのツリーの全ルーンとシャード3行を並べ、選んだものを強調する
export function RuneTreeView({ participant: p }: RuneTreeViewProps) {
  const subRows = getSubTreeRows(p.sub_style_id);
  return (
    <div className="flex flex-wrap gap-6">
      <RuneTree
        label="メイン"
        rows={getPrimaryTreeRows(p.primary_style_id)}
        selectedRows={p.primary_perk_ids.map((id) => [id])}
      />
      <RuneTree
        label="サブ"
        rows={subRows}
        selectedRows={subRows.map(() => p.sub_perk_ids)}
      />
      <RuneTree
        label="シャード"
        rows={getShardRows()}
        selectedRows={p.stat_perk_ids.map((id) => [id])}
      />
    </div>
  );
}

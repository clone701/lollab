import { formatTimeAgo } from '@/lib/summoner-search';
import { ExpandButton } from './ExpandButton';

interface MatchCardSideProps {
  timeAgoSeconds: number;
  isOpen: boolean;
  panelId: string;
  onToggle: () => void;
}

// 右端: 経過時間と展開ボタン
export function MatchCardSide({
  timeAgoSeconds,
  isOpen,
  panelId,
  onToggle,
}: MatchCardSideProps) {
  return (
    <div className="flex flex-col items-end gap-1 flex-shrink-0">
      <p className="text-xs text-fg-subtle">{formatTimeAgo(timeAgoSeconds)}</p>
      <ExpandButton isOpen={isOpen} panelId={panelId} onToggle={onToggle} />
    </div>
  );
}

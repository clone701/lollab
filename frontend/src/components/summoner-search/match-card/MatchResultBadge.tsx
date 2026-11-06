interface MatchResultBadgeProps {
  isWin: boolean;
}

// 勝敗ラベル
export function MatchResultBadge({ isWin }: MatchResultBadgeProps) {
  return (
    <div
      className={`w-10 text-center text-xs font-bold rounded py-1 ${
        isWin ? 'bg-win text-canvas' : 'bg-loss text-canvas'
      }`}
    >
      {isWin ? '勝利' : '敗北'}
    </div>
  );
}

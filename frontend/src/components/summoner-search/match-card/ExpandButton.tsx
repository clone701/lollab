interface ExpandButtonProps {
  isOpen: boolean;
  /** 開閉する試合詳細の ID（開いているときだけ aria-controls に付ける） */
  panelId: string;
  onToggle: () => void;
}

// 試合詳細の展開ボタン。開いているときは▼の向きを反転する
export function ExpandButton({ isOpen, panelId, onToggle }: ExpandButtonProps) {
  return (
    <button
      type="button"
      aria-expanded={isOpen}
      aria-controls={isOpen ? panelId : undefined}
      aria-label={isOpen ? '詳細を閉じる' : '詳細を展開'}
      onClick={onToggle}
      className="text-fg-subtle hover:text-fg-muted text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <span
        aria-hidden="true"
        data-testid="expand-icon"
        className={`inline-block transition-transform duration-150 ${
          isOpen ? 'rotate-180' : ''
        }`}
      >
        ▼
      </span>
    </button>
  );
}

interface MatchDetailErrorProps {
  message: string;
  onRetry: () => void;
}

export function MatchDetailError({ message, onRetry }: MatchDetailErrorProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <p role="alert" className="text-sm text-danger-fg">
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded bg-action px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-action-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        再試行
      </button>
    </div>
  );
}

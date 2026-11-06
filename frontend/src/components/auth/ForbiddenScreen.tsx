import { GateScreen } from './GateScreen';

interface ForbiddenScreenProps {
  onSignOut: () => void | Promise<void>;
}

export function ForbiddenScreen({ onSignOut }: ForbiddenScreenProps) {
  return (
    <GateScreen
      title="このアカウントでは利用できません"
      description="別のアカウントでログインし直してください。"
    >
      <button
        type="button"
        onClick={onSignOut}
        className="rounded-lg bg-action px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-action-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        ログアウト
      </button>
    </GateScreen>
  );
}

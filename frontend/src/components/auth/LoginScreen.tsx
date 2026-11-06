import { GateScreen } from './GateScreen';

interface LoginScreenProps {
  onSignIn: () => void | Promise<void>;
}

export function LoginScreen({ onSignIn }: LoginScreenProps) {
  return (
    <GateScreen
      title="LoL Lab"
      description="利用するにはログインしてください。"
    >
      <button
        type="button"
        onClick={onSignIn}
        className="rounded-lg bg-action px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-action-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        Google でログイン
      </button>
    </GateScreen>
  );
}

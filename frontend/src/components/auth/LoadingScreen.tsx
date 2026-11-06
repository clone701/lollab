import { GateScreen } from './GateScreen';

export function LoadingScreen() {
  return (
    <GateScreen>
      <p role="status" className="text-sm text-fg-muted">
        読み込み中...
      </p>
    </GateScreen>
  );
}

import { MODE_OPTIONS } from '@/lib/champion-build';
import type { BuildMode } from '@/types/championBuild';

interface ModeToggleProps {
  mode: BuildMode;
  onChange: (mode: BuildMode) => void;
}

const SELECTED = 'ring-2 ring-accent bg-accent/15';
const NORMAL = 'bg-surface-2 hover:ring-2 hover:ring-accent/60';

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="flex gap-2" role="group" aria-label="ビルドの種類">
      {MODE_OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={mode === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-lg px-3 py-1 text-sm text-fg transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${mode === o.value ? SELECTED : NORMAL}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

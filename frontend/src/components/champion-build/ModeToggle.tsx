import { MODE_OPTIONS } from '@/lib/champion-build';
import type { BuildMode } from '@/types/championBuild';

interface ModeToggleProps {
  mode: BuildMode;
  onChange: (mode: BuildMode) => void;
}

const SELECTED = 'ring-2 ring-blue-500 shadow-md shadow-blue-500/20 bg-blue-50';
const NORMAL = 'bg-gray-50 hover:ring-2 hover:ring-blue-400';

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="flex gap-2" role="group" aria-label="ビルドの種類">
      {MODE_OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={mode === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-lg px-3 py-1 text-sm text-gray-800 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${mode === o.value ? SELECTED : NORMAL}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

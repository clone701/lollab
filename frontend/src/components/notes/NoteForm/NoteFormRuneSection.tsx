'use client';

import RuneSelector from '../RuneSelector';
import { RuneConfig } from '@/types/note';

interface NoteFormRuneSectionProps {
  mode: 'create' | 'view' | 'edit';
  runes: RuneConfig | null;
  runeKey: number;
  errors: Record<string, string>;
  setRunes: (v: RuneConfig | null) => void;
  handleRuneReset: () => void;
}

export function NoteFormRuneSection({
  mode,
  runes,
  runeKey,
  errors,
  setRunes,
  handleRuneReset,
}: NoteFormRuneSectionProps) {
  return (
    <div className="mb-6" id="section-runes">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-fg">ルーン</h3>
        {mode !== 'view' && (
          <button
            onClick={handleRuneReset}
            className="px-2 py-1 text-xs text-fg-muted border border-line-strong rounded hover:bg-surface-2 transition-colors duration-150"
          >
            リセット
          </button>
        )}
      </div>
      <RuneSelector
        key={runeKey}
        value={runes}
        onChange={setRunes}
        disabled={mode === 'view'}
      />
      {errors.runes && (
        <p className="text-sm text-danger-fg mt-1" role="alert">
          {errors.runes}
        </p>
      )}
    </div>
  );
}

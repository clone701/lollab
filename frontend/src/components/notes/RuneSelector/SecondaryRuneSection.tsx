'use client';

import { RUNE_PATHS, getSecondaryRunes } from '@/lib/data/runes';
import { RuneButton } from './RuneButton';

interface SecondaryRuneSectionProps {
  primaryPath: number | null;
  secondaryPath: number | null;
  secondaryRunes: number[];
  disabled: boolean;
  onPathChange: (id: number) => void;
  onRuneToggle: (id: number) => void;
}

export function SecondaryRuneSection({
  primaryPath,
  secondaryPath,
  secondaryRunes,
  disabled,
  onPathChange,
  onRuneToggle,
}: SecondaryRuneSectionProps) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-3">Secondary</h4>
      {primaryPath && (
        <>
          <div className="mb-4 flex gap-2 flex-wrap">
            {RUNE_PATHS.filter((p) => p.id !== primaryPath).map((path) => (
              <RuneButton
                key={path.id}
                id={path.id}
                icon={path.icon}
                name={path.name}
                selected={secondaryPath === path.id}
                disabled={disabled}
                size="sm"
                ariaLabel={`サブルーンパス: ${path.name}`}
                onClick={() => onPathChange(path.id)}
              />
            ))}
          </div>
          {secondaryPath && (
            <div className="grid grid-cols-3 gap-2">
              {getSecondaryRunes(secondaryPath).map((rune) => (
                <RuneButton
                  key={rune.id}
                  id={rune.id}
                  icon={rune.icon}
                  name={rune.name}
                  selected={secondaryRunes.includes(rune.id)}
                  disabled={disabled}
                  ariaLabel={`サブルーン: ${rune.name}`}
                  onClick={() => onRuneToggle(rune.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

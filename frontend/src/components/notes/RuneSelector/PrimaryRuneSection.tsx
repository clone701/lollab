'use client';

import { RUNE_PATHS, getKeystones, getPrimaryRunes } from '@/lib/data/runes';
import { RuneButton } from './RuneButton';

interface PrimaryRuneSectionProps {
  primaryPath: number | null;
  keystone: number | null;
  primaryRunes: number[];
  disabled: boolean;
  onPathChange: (id: number) => void;
  onKeystoneChange: (id: number) => void;
  onRuneChange: (slot: number, id: number) => void;
}

export function PrimaryRuneSection({
  primaryPath,
  keystone,
  primaryRunes,
  disabled,
  onPathChange,
  onKeystoneChange,
  onRuneChange,
}: PrimaryRuneSectionProps) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-3">Primary</h4>
      <div className="mb-4 flex gap-2 flex-wrap">
        {RUNE_PATHS.map((path) => (
          <RuneButton
            key={path.id}
            id={path.id}
            icon={path.icon}
            name={path.name}
            selected={primaryPath === path.id}
            disabled={disabled}
            size="sm"
            ariaLabel={`メインルーンパス: ${path.name}`}
            onClick={() => onPathChange(path.id)}
          />
        ))}
      </div>
      {primaryPath && (
        <>
          <div className="mb-4 grid grid-cols-4 gap-2">
            {getKeystones(primaryPath).map((rune) => (
              <RuneButton
                key={rune.id}
                id={rune.id}
                icon={rune.icon}
                name={rune.name}
                selected={keystone === rune.id}
                disabled={disabled}
                ariaLabel={`キーストーン: ${rune.name}`}
                onClick={() => onKeystoneChange(rune.id)}
              />
            ))}
          </div>
          <div className="space-y-2">
            {[0, 1, 2].map((slot) => (
              <div key={slot} className="grid grid-cols-3 gap-2">
                {getPrimaryRunes(primaryPath, slot).map((rune) => (
                  <RuneButton
                    key={rune.id}
                    id={rune.id}
                    icon={rune.icon}
                    name={rune.name}
                    selected={primaryRunes[slot] === rune.id}
                    disabled={disabled}
                    ariaLabel={`メインルーン ${slot + 1}: ${rune.name}`}
                    onClick={() => onRuneChange(slot, rune.id)}
                  />
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

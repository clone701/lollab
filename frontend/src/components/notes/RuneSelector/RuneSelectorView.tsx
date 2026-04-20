'use client';

import { PrimaryRuneSection } from './PrimaryRuneSection';
import { SecondaryRuneSection } from './SecondaryRuneSection';
import { ShardsSection } from './ShardsSection';

interface RuneSelectorViewProps {
  primaryPath: number | null;
  secondaryPath: number | null;
  keystone: number | null;
  primaryRunes: number[];
  secondaryRunes: number[];
  shards: number[];
  disabled: boolean;
  onPrimaryPathChange: (id: number) => void;
  onSecondaryPathChange: (id: number) => void;
  onKeystoneChange: (id: number) => void;
  onPrimaryRuneChange: (slot: number, id: number) => void;
  onSecondaryRuneToggle: (id: number) => void;
  onShardChange: (slot: number, id: number) => void;
}

export function RuneSelectorView({
  primaryPath,
  secondaryPath,
  keystone,
  primaryRunes,
  secondaryRunes,
  shards,
  disabled,
  onPrimaryPathChange,
  onSecondaryPathChange,
  onKeystoneChange,
  onPrimaryRuneChange,
  onSecondaryRuneToggle,
  onShardChange,
}: RuneSelectorViewProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PrimaryRuneSection
          primaryPath={primaryPath}
          keystone={keystone}
          primaryRunes={primaryRunes}
          disabled={disabled}
          onPathChange={onPrimaryPathChange}
          onKeystoneChange={onKeystoneChange}
          onRuneChange={onPrimaryRuneChange}
        />
        <SecondaryRuneSection
          primaryPath={primaryPath}
          secondaryPath={secondaryPath}
          secondaryRunes={secondaryRunes}
          disabled={disabled}
          onPathChange={onSecondaryPathChange}
          onRuneToggle={onSecondaryRuneToggle}
        />
        <ShardsSection
          shards={shards}
          disabled={disabled}
          onShardChange={onShardChange}
        />
      </div>
    </div>
  );
}

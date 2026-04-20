'use client';

import { memo } from 'react';
import { RuneConfig } from '@/types/note';
import { useRuneSelector } from './useRuneSelector';
import { RuneSelectorView } from './RuneSelectorView';

interface RuneSelectorProps {
  value: RuneConfig | null;
  onChange: (runes: RuneConfig) => void;
  disabled?: boolean;
}

function RuneSelector({
  value,
  onChange,
  disabled = false,
}: RuneSelectorProps) {
  const {
    primaryPath,
    secondaryPath,
    keystone,
    primaryRunes,
    secondaryRunes,
    shards,
    handlePrimaryPathChange,
    handleSecondaryPathChange,
    handlePrimaryRuneChange,
    handleSecondaryRuneToggle,
    handleShardChange,
    handleKeystoneChange,
  } = useRuneSelector({ value, onChange });

  return (
    <RuneSelectorView
      primaryPath={primaryPath}
      secondaryPath={secondaryPath}
      keystone={keystone}
      primaryRunes={primaryRunes}
      secondaryRunes={secondaryRunes}
      shards={shards}
      disabled={disabled}
      onPrimaryPathChange={handlePrimaryPathChange}
      onSecondaryPathChange={handleSecondaryPathChange}
      onKeystoneChange={handleKeystoneChange}
      onPrimaryRuneChange={handlePrimaryRuneChange}
      onSecondaryRuneToggle={handleSecondaryRuneToggle}
      onShardChange={handleShardChange}
    />
  );
}

export default memo(RuneSelector);

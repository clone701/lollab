'use client';

import { useState, useEffect, useCallback } from 'react';
import { getRuneSlot } from '@/lib/data/runes';
import { RuneConfig } from '@/types/note';

interface UseRuneSelectorProps {
  value: RuneConfig | null;
  onChange: (runes: RuneConfig) => void;
}

export function useRuneSelector({ value, onChange }: UseRuneSelectorProps) {
  const [primaryPath, setPrimaryPath] = useState<number | null>(
    value?.primaryPath || null
  );
  const [secondaryPath, setSecondaryPath] = useState<number | null>(
    value?.secondaryPath || null
  );
  const [keystone, setKeystone] = useState<number | null>(
    value?.keystone || null
  );
  const [primaryRunes, setPrimaryRunes] = useState<number[]>(
    value?.primaryRunes || []
  );
  const [secondaryRunes, setSecondaryRunes] = useState<number[]>(
    value?.secondaryRunes || []
  );
  const [shards, setShards] = useState<number[]>(value?.shards || []);

  useEffect(() => {
    if (value === null) {
      setPrimaryPath(null);
      setSecondaryPath(null);
      setKeystone(null);
      setPrimaryRunes([]);
      setSecondaryRunes([]);
      setShards([]);
    }
  }, [value]);

  const handlePrimaryPathChange = useCallback((pathId: number) => {
    setPrimaryPath(pathId);
    setKeystone(null);
    setPrimaryRunes([]);
    setSecondaryPath((prev) => (prev === pathId ? null : prev));
    setSecondaryRunes([]);
  }, []);

  const handleSecondaryPathChange = useCallback((pathId: number) => {
    setSecondaryPath(pathId);
    setSecondaryRunes([]);
  }, []);

  const handlePrimaryRuneChange = useCallback(
    (slot: number, runeId: number) => {
      setPrimaryRunes((prev) => {
        const n = [...prev];
        // 再選択で解除
        n[slot] = n[slot] === runeId ? 0 : runeId;
        return n;
      });
    },
    []
  );

  const handleKeystoneChange = useCallback((runeId: number) => {
    setKeystone((prev) => (prev === runeId ? null : runeId));
  }, []);

  const handleSecondaryRuneToggle = useCallback(
    (runeId: number) => {
      if (!secondaryPath) return;
      setSecondaryRunes((prev) => {
        const clickedSlot = getRuneSlot(secondaryPath, runeId);
        if (clickedSlot === null) return prev;
        const selectedSlots = prev.map((id) => getRuneSlot(secondaryPath, id));
        if (prev.includes(runeId)) return prev.filter((id) => id !== runeId);
        if (selectedSlots.includes(clickedSlot))
          return prev.map((id) =>
            getRuneSlot(secondaryPath, id) === clickedSlot ? runeId : id
          );
        if (prev.length < 2) return [...prev, runeId];
        return [prev[1], runeId];
      });
    },
    [secondaryPath]
  );

  const handleShardChange = useCallback((slot: number, shardId: number) => {
    setShards((prev) => {
      const n = [...prev];
      // 再選択で解除
      n[slot] = n[slot] === shardId ? 0 : shardId;
      return n;
    });
  }, []);

  useEffect(() => {
    // 常にonChangeを呼び、useNoteFormのrunes stateを最新に保つ
    // バリデーションはhandleSave時に行う
    onChange({
      primaryPath: primaryPath ?? 0,
      secondaryPath: secondaryPath ?? 0,
      keystone: keystone ?? 0,
      primaryRunes,
      secondaryRunes,
      shards,
    });
  }, [
    primaryPath,
    secondaryPath,
    keystone,
    primaryRunes,
    secondaryRunes,
    shards,
    onChange,
  ]);

  return {
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
    setKeystone,
  };
}

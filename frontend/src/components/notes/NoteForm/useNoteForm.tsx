'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { RuneConfig, ChampionNote } from '@/types/note';
import { createNote, updateNote, NoteUpdateData } from '@/adapters/supabase';
import useToast from '@/lib/hooks/useToast';
import { getChampionById } from '@/lib/utils/championHelpers';
import { getInitialFormValues } from './initialFormValues';
import { validateNoteForm } from './validateNoteForm';
import { UseNoteFormReturn, UseNoteFormProps } from './types';

export function useNoteForm({
  mode,
  myChampionId,
  enemyChampionId,
  initialData,
  onSave,
}: UseNoteFormProps): UseNoteFormReturn {
  const initial = getInitialFormValues(initialData);
  const [presetName, setPresetName] = useState(initial.presetName);
  const [runes, setRunes] = useState<RuneConfig | null>(initial.runes);
  const [runeKey, setRuneKey] = useState(0);
  const [spells, setSpells] = useState<string[]>(initial.spells);
  const [items, setItems] = useState<string[]>(initial.items);
  const [memo, setMemo] = useState(initial.memo);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  const { user } = useAuth();

  const resetToNote = (note: ChampionNote) => {
    const values = getInitialFormValues(note);
    setPresetName(values.presetName);
    setRunes(values.runes);
    setSpells(values.spells);
    setItems(values.items);
    setMemo(values.memo);
    setRuneKey((prev) => prev + 1); // RuneSelectorを再マウントして値を反映
  };
  // initialData が差し替わったらフォームを初期値に戻す（レンダー中に前回値と比較）
  const [prevInitialData, setPrevInitialData] = useState(initialData);
  if (prevInitialData !== initialData) {
    setPrevInitialData(initialData);
    if (initialData) resetToNote(initialData);
  }

  const handleSave = async () => {
    const newErrors = validateNoteForm({
      mode,
      presetName,
      spells,
      runes,
      items,
      memo,
    });
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      // SS > ITEM > RUNE の優先度でスクロール
      const priority = ['spells', 'items', 'runes'];
      const firstError =
        priority.find((key) => newErrors[key]) ?? Object.keys(newErrors)[0];
      const sectionId =
        firstError === 'spells'
          ? 'section-spells'
          : firstError === 'items'
            ? 'section-items'
            : firstError === 'runes'
              ? 'section-runes'
              : firstError === 'presetName'
                ? 'section-preset'
                : null;
      if (sectionId) {
        requestAnimationFrame(() => {
          document
            .getElementById(sectionId)
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
      }
      return;
    }

    let finalPresetName = presetName.trim();
    if (!finalPresetName) {
      const myChamp = getChampionById(myChampionId);
      const enemyChamp = getChampionById(enemyChampionId);
      if (myChamp && enemyChamp) {
        finalPresetName = `${myChamp.name} VS ${enemyChamp.name}`;
      } else if (enemyChamp) {
        finalPresetName = `VS ${enemyChamp.name}`;
      } else {
        finalPresetName = 'デフォルトプリセット';
      }
    }
    setSaving(true);
    try {
      if (mode === 'edit' && initialData && user) {
        const updateData: NoteUpdateData = {
          preset_name: finalPresetName,
          runes,
          spells,
          items,
          memo: memo || null,
        };
        await updateNote(
          (initialData as ChampionNote).id.toString(),
          user.id,
          updateData
        );
        showToast('ノートを更新しました', 'success');
      } else {
        await createNote({
          my_champion_id: myChampionId,
          enemy_champion_id: enemyChampionId,
          preset_name: finalPresetName,
          runes,
          spells,
          items,
          memo: memo || null,
        });
      }
      if (onSave) onSave();
    } catch (error) {
      console.error('Failed to save note:', error);
      showToast(
        mode === 'edit'
          ? 'ノートの更新に失敗しました'
          : 'ノートの作成に失敗しました',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRuneReset = () => {
    setRunes(null);
    setRuneKey((prev) => prev + 1);
  };

  const handleCancel = () => {
    // キャンセル時は initialData の値に戻す
    if (initialData) resetToNote(initialData);
    setErrors({});
  };

  return {
    presetName,
    runes,
    runeKey,
    spells,
    items,
    memo,
    errors,
    saving,
    toast,
    setPresetName,
    setRunes,
    setSpells,
    setItems,
    setMemo,
    handleSave,
    handleRuneReset,
    handleCancel,
    hideToast,
  };
}

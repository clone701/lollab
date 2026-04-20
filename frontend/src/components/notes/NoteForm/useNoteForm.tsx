'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { RuneConfig, ChampionNote } from '@/types/note';
import { createNote, updateNote, NoteUpdateData } from '@/adapters/supabase';
import useToast from '@/lib/hooks/useToast';
import { getChampionById } from '@/lib/utils/championHelpers';
import { validateNoteForm } from './validateNoteForm';
import { UseNoteFormReturn, UseNoteFormProps } from './types';

export function useNoteForm({
  mode,
  myChampionId,
  enemyChampionId,
  initialData,
  onSave,
}: UseNoteFormProps): UseNoteFormReturn {
  const [presetName, setPresetName] = useState('');
  const [runes, setRunes] = useState<RuneConfig | null>(null);
  const [runeKey, setRuneKey] = useState(0);
  const [spells, setSpells] = useState<string[]>([]);
  const [items, setItems] = useState<string[]>([]);
  const [memo, setMemo] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (initialData) {
      setPresetName(initialData.preset_name || '');
      setRunes(initialData.runes);
      setSpells(initialData.spells || []);
      setItems(initialData.items || []);
      setMemo(initialData.memo || '');
      setRuneKey((prev) => prev + 1);
    }
  }, [initialData]);

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
      const enemy = getChampionById(enemyChampionId);
      finalPresetName = enemy ? `VS${enemy.name}` : 'デフォルトプリセット';
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
    if (initialData) {
      setPresetName(initialData.preset_name || '');
      setRunes(initialData.runes);
      setSpells(initialData.spells || []);
      setItems(initialData.items || []);
      setMemo(initialData.memo || '');
      setRuneKey((prev) => prev + 1); // RuneSelectorを再マウントして初期値に戻す
    }
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

'use client';

import { useState, type FormEvent } from 'react';
import { createPickSheet } from '@/adapters/supabase';
import { validateSheetName } from '@/lib/my-pick';
import type { PickLane } from '@/types/myPick';
import type { ShowToast } from '../types';

// 新規作成の入力状態と、作成の実行
export function useCreatePickSheet(
  initialLane: PickLane,
  onCreated: (sheetId: number) => void,
  onToast: ShowToast
) {
  const [name, setName] = useState('');
  const [lane, setLane] = useState<PickLane>(initialLane);
  const [isTouched, setIsTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isInvalid = validateSheetName(name).error !== null;

  const handleNameChange = (value: string) => {
    setName(value);
    setIsTouched(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isInvalid || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const sheet = await createPickSheet(name, lane);
      onCreated(sheet.id);
    } catch {
      onToast('マイピック表の作成に失敗しました', 'error');
      setIsSubmitting(false);
    }
  };

  return {
    name,
    lane,
    isTouched,
    isSubmitting,
    isInvalid,
    setLane,
    handleNameChange,
    handleSubmit,
  };
}

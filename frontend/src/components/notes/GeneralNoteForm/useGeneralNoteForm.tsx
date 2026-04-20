'use client';

import { useState } from 'react';
import { GeneralNote, GeneralNoteFormData } from '@/types/generalNote';
import { validateTitle, validateBody } from '@/lib/utils/generalNoteValidation';

interface UseGeneralNoteFormProps {
  initialData?: GeneralNote;
  onSave: (data: GeneralNoteFormData) => Promise<void>;
}

export function useGeneralNoteForm({
  initialData,
  onSave,
}: UseGeneralNoteFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [body, setBody] = useState(initialData?.body ?? '');
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    const titleError = validateTitle(title);
    const bodyError = validateBody(body);
    const newErrors: Record<string, string> = {};
    if (titleError) newErrors.title = titleError;
    if (bodyError) newErrors.body = bodyError;
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    try {
      await onSave({ title, body, tags });
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('認証')) {
        setErrors({ submit: 'ログインが必要です' });
      } else if (err instanceof TypeError) {
        setErrors({ submit: 'ネットワークエラーが発生しました' });
      } else {
        setErrors({ submit: '保存に失敗しました' });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    title,
    setTitle,
    body,
    setBody,
    tags,
    setTags,
    errors,
    isSubmitting,
    handleSubmit,
  };
}

'use client';

import { useState, RefObject } from 'react';
import { champions } from '@/lib/data/champions';
import { Champion } from '@/types/champion';

interface SuggestState {
  candidates: Champion[];
  triggerIndex: number; // '/' の位置
}

export function useChampionSuggest(
  body: string,
  setBody: (v: string) => void,
  textareaRef: RefObject<HTMLTextAreaElement | null>
) {
  const [suggest, setSuggest] = useState<SuggestState | null>(null);

  function handleBodyChange(value: string) {
    setBody(value);
    const el = textareaRef.current;
    if (!el) return;
    const cursor = el.selectionStart;
    // カーソル前のテキストで最後の '/' を探す
    const before = value.slice(0, cursor);
    const slashIdx = before.lastIndexOf('/');
    if (slashIdx === -1) {
      setSuggest(null);
      return;
    }
    // '/' とカーソルの間にスペースや改行があれば閉じる
    const query = before.slice(slashIdx + 1);
    if (/[\s\n]/.test(query)) {
      setSuggest(null);
      return;
    }
    const candidates = champions
      .filter((c) => c.id.toLowerCase().startsWith(query.toLowerCase()))
      .slice(0, 8);
    setSuggest(
      candidates.length > 0 ? { candidates, triggerIndex: slashIdx } : null
    );
  }

  function selectCandidate(champion: Champion) {
    const el = textareaRef.current;
    if (!el || !suggest) return;
    const cursor = el.selectionStart;
    const newBody =
      body.slice(0, suggest.triggerIndex) +
      '/' +
      champion.id +
      body.slice(cursor);
    setBody(newBody);
    setSuggest(null);
    const newCursor = suggest.triggerIndex + champion.id.length + 1;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(newCursor, newCursor);
    });
  }

  function closeSuggest() {
    setSuggest(null);
  }

  return { suggest, handleBodyChange, selectCandidate, closeSuggest };
}

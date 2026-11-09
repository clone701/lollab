'use client';

import { useState, RefObject } from 'react';
import { CHAMPIONS_BY_READING } from '@/lib/champion-order';
import { Champion } from '@/types/champion';

interface SuggestState {
  candidates: Champion[];
  triggerIndex: number; // '/' の位置
  focusedIndex: number; // フォーカスされている候補のインデックス
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
    const q = query.toLowerCase();
    // 候補は五十音順の先頭8件
    const candidates = CHAMPIONS_BY_READING.filter(
      (c) =>
        c.id.toLowerCase().startsWith(q) ||
        c.name.toLowerCase().includes(q) ||
        (c.reading && c.reading.includes(q))
    ).slice(0, 8);
    setSuggest(
      candidates.length > 0
        ? { candidates, triggerIndex: slashIdx, focusedIndex: 0 }
        : null
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

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!suggest) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSuggest((prev) =>
        prev
          ? {
              ...prev,
              focusedIndex:
                prev.focusedIndex < prev.candidates.length - 1
                  ? prev.focusedIndex + 1
                  : 0,
            }
          : null
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSuggest((prev) =>
        prev
          ? {
              ...prev,
              focusedIndex:
                prev.focusedIndex > 0
                  ? prev.focusedIndex - 1
                  : prev.candidates.length - 1,
            }
          : null
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const champion = suggest.candidates[suggest.focusedIndex];
      if (champion) {
        selectCandidate(champion);
      }
    } else if (e.key === 'Escape') {
      closeSuggest();
      e.preventDefault();
    }
  }

  function closeSuggest() {
    setSuggest(null);
  }

  return {
    suggest,
    handleBodyChange,
    selectCandidate,
    closeSuggest,
    handleKeyDown,
  };
}

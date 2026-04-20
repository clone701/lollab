'use client';

import { useState, useMemo } from 'react';
import { GeneralNote } from '@/types/generalNote';

export function useNoteFilter(notes: GeneralNote[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // 全ノートから重複なしのタグ一覧を生成
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach((n) => n.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [notes]);

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const matchesTag = activeTag ? note.tags.includes(activeTag) : true;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = q
        ? note.title.toLowerCase().includes(q) ||
          (note.body ?? '').toLowerCase().includes(q)
        : true;
      return matchesTag && matchesSearch;
    });
  }, [notes, searchQuery, activeTag]);

  const toggleTag = (tag: string) =>
    setActiveTag((prev) => (prev === tag ? null : tag));

  return {
    searchQuery,
    setSearchQuery,
    activeTag,
    toggleTag,
    allTags,
    filteredNotes,
  };
}

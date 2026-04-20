'use client';

import { useRef } from 'react';
import { GeneralNote, GeneralNoteFormData } from '@/types/generalNote';
import { CharCounter } from './CharCounter';
import { TagInput } from './TagInput';
import { MarkdownToolbar } from './MarkdownToolbar';
import { ChampionSuggestDropdown } from './ChampionSuggestDropdown';
import { useGeneralNoteForm } from './useGeneralNoteForm';
import { useMarkdownToolbar } from './useMarkdownToolbar';
import { useChampionSuggest } from './useChampionSuggest';

interface GeneralNoteFormProps {
  mode: 'create' | 'edit';
  initialData?: GeneralNote;
  onSave: (data: GeneralNoteFormData) => Promise<void>;
  onCancel: () => void;
}

export function GeneralNoteForm({
  mode: _mode,
  initialData,
  onSave,
  onCancel,
}: GeneralNoteFormProps) {
  const {
    title,
    setTitle,
    body,
    setBody,
    tags,
    setTags,
    errors,
    isSubmitting,
    handleSubmit,
  } = useGeneralNoteForm({ initialData, onSave });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toolbar = useMarkdownToolbar(body, textareaRef);
  const { suggest, handleBodyChange, selectCandidate, closeSuggest } =
    useChampionSuggest(body, setBody, textareaRef);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape' && suggest) {
      closeSuggest();
      e.preventDefault();
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="タイトル"
          maxLength={101}
          className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800"
        />
        {errors.title && (
          <p className="text-red-500 text-xs mt-1">{errors.title}</p>
        )}
      </div>
      <div className="relative">
        <MarkdownToolbar
          onBold={toolbar.bold}
          onItalic={toolbar.italic}
          onHeading={toolbar.heading}
          onBulletList={toolbar.bulletList}
          onNumberedList={toolbar.numberedList}
        />
        <textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => handleBodyChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="本文 （/yasuoでチャンピオン補完）"
          rows={8}
          className="w-full border border-gray-200 rounded-b px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800 resize-none"
        />
        {suggest && (
          <ChampionSuggestDropdown
            candidates={suggest.candidates}
            onSelect={selectCandidate}
            onClose={closeSuggest}
          />
        )}
        <div className="flex justify-between items-center mt-1">
          {errors.body ? (
            <p className="text-red-500 text-xs">{errors.body}</p>
          ) : (
            <span />
          )}
          <CharCounter current={body.length} max={10000} />
        </div>
      </div>
      <TagInput tags={tags} onChange={setTags} />
      {errors.submit && <p className="text-red-500 text-sm">{errors.submit}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50 transition-colors duration-150"
        >
          キャンセル
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-50 transition-colors duration-150"
        >
          保存
        </button>
      </div>
    </div>
  );
}

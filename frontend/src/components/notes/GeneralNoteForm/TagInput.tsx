'use client';

import { useState, KeyboardEvent } from 'react';
import { validateTag } from '@/lib/utils/generalNoteValidation';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
  maxTagLength?: number;
}

export function TagInput({
  tags,
  onChange,
  maxTags = 10,
  maxTagLength = 20,
}: TagInputProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    const validationError = validateTag(trimmed);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    onChange([...tags, trimmed]);
    setInput('');
  }

  function handleRemove(index: number) {
    onChange(tags.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag, i) => (
          <span
            key={i}
            className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm"
          >
            {tag}
            <button
              type="button"
              onClick={() => handleRemove(i)}
              className="text-gray-600 hover:text-gray-800"
              aria-label={`タグ「${tag}」を削除`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setError(null);
        }}
        onKeyDown={handleKeyDown}
        disabled={tags.length >= maxTags}
        placeholder={
          tags.length >= maxTags ? `最大${maxTags}タグ` : 'Enterでタグを追加'
        }
        className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800 disabled:bg-gray-100 disabled:cursor-not-allowed"
        maxLength={maxTagLength + 1}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

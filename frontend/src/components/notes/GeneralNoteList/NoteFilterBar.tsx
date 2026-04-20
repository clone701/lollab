'use client';

interface NoteFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  allTags: string[];
  activeTag: string | null;
  onToggleTag: (tag: string) => void;
}

export function NoteFilterBar({
  searchQuery,
  onSearchChange,
  allTags,
  activeTag,
  onToggleTag,
}: NoteFilterBarProps) {
  return (
    <div className="mb-3 space-y-2">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="タイトル・本文を検索..."
        className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800"
      />
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onToggleTag(tag)}
              className={`px-2 py-0.5 text-xs rounded-full border transition-colors duration-150 ${
                activeTag === tag
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

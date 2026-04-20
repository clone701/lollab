import type { SuggestCandidate, Region } from '@/types/summoner';

interface SuggestDropdownProps {
  candidates: SuggestCandidate[];
  focusedIndex: number;
  onSelect: (candidate: SuggestCandidate) => void;
  region: Region;
}

export default function SuggestDropdown({
  candidates,
  focusedIndex,
  onSelect,
  region,
}: SuggestDropdownProps) {
  if (candidates.length === 0) return null;

  return (
    <ul
      role="listbox"
      aria-label="サモナー候補"
      className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden"
    >
      {candidates.map((candidate, index) => (
        <li
          key={`${candidate.name}-${candidate.tagLine}-${candidate.region}`}
          role="option"
          aria-selected={index === focusedIndex}
        >
          <button
            type="button"
            onMouseDown={(e) => {
              // blur より先に選択を確定させる
              e.preventDefault();
              onSelect(candidate);
            }}
            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors duration-150 focus:outline-none ${
              index === focusedIndex
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="font-medium">{candidate.name}</span>
            <span className="text-xs text-gray-400 ml-2">
              #{candidate.tagLine}
              {candidate.region !== region && (
                <span className="ml-1 text-gray-300">· {candidate.region}</span>
              )}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

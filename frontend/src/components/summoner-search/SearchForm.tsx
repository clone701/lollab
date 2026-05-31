'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Region, SuggestCandidate } from '@/types/summoner';
import { REGION_DEFAULT_TAGS } from '@/types/summoner';
import {
  validateSummonerName,
  filterSuggestions,
  MOCK_SUGGEST_CANDIDATES,
} from '@/lib/summoner-search';
import {
  getRecentSearches,
  addRecentSearch,
  removeRecentSearch,
} from '@/lib/recentSearches';
import {
  fetchFavorites,
  removeFavorite as removeFavApi,
} from '@/adapters/supabase/favorites';
import type { FavoriteEntry } from '@/adapters/supabase/favorites';
import { useAuth } from '@/lib/contexts/AuthContext';
import type { RecentSearch } from '@/lib/recentSearches';
import RegionSelector from './RegionSelector';
import SuggestDropdown from './SuggestDropdown';
import SearchHistoryDropdown from './SearchHistoryDropdown';

interface SearchFormProps {
  onSearch: (query: string, region: Region) => void;
}

export default function SearchForm({ onSearch }: SearchFormProps) {
  const { user } = useAuth();
  const [region, setRegion] = useState<Region>('JP');
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([]);

  useEffect(() => {
    setRecentSearches(getRecentSearches());
    if (user) {
      fetchFavorites()
        .then(setFavorites)
        .catch(() => {});
    }
  }, [user]);

  const candidates = useCallback(
    () => filterSuggestions(MOCK_SUGGEST_CANDIDATES, value, region),
    [value, region]
  )();

  const isDropdownOpen = isFocused && candidates.length > 0;

  function handleSubmit(query = value) {
    const result = validateSummonerName(query);
    if (result === false) return;
    if (typeof result === 'string') {
      setError(result);
      return;
    }
    setError(null);
    setIsFocused(false);
    const trimmed = query.trim();
    // 検索履歴に追加
    const [gn, tl] = trimmed.includes('#')
      ? trimmed.split('#')
      : [trimmed, REGION_DEFAULT_TAGS[region]];
    addRecentSearch({ name: gn, tagLine: tl, region });
    setRecentSearches(getRecentSearches());
    onSearch(trimmed, region);
  }

  function handleSelect(candidate: SuggestCandidate) {
    const query = `${candidate.name}#${candidate.tagLine}`;
    setValue(query);
    setFocusedIndex(-1);
    handleSubmit(query);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      if (isDropdownOpen && focusedIndex >= 0) {
        handleSelect(candidates[focusedIndex]);
      } else {
        handleSubmit();
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => Math.min(prev + 1, candidates.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => Math.max(prev - 1, -1));
      return;
    }
    if (e.key === 'Escape') {
      setIsFocused(false);
      setFocusedIndex(-1);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue(e.target.value);
    setFocusedIndex(-1);
    setError(null);
  }

  return (
    <div className="w-full space-y-2">
      <div className="relative flex items-center bg-white border border-gray-300 rounded-full shadow-sm focus-within:ring-2 focus-within:ring-blue-400 overflow-visible">
        {/* 地域セレクター */}
        <RegionSelector value={region} onChange={setRegion} />

        {/* 区切り線 */}
        <div
          className="w-px h-5 bg-gray-300 mx-1 flex-shrink-0"
          aria-hidden="true"
        />

        {/* 入力欄 */}
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // SuggestDropdown の mousedown より後に blur が来るので少し遅延
            setTimeout(() => setIsFocused(false), 150);
          }}
          placeholder={`サモナー名 + #${REGION_DEFAULT_TAGS[region]}`}
          className="flex-1 px-3 py-3 text-sm outline-none bg-transparent"
          aria-label="サモナー名"
          aria-autocomplete="list"
        />

        {/* 検索ボタン */}
        <button
          type="button"
          onClick={() => handleSubmit()}
          aria-label="検索"
          className="flex-shrink-0 mr-2 p-2 text-gray-400 hover:text-gray-600 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-full"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>

        {/* サジェストプルダウン */}
        {isDropdownOpen && (
          <SuggestDropdown
            candidates={candidates}
            focusedIndex={focusedIndex}
            onSelect={handleSelect}
            region={region}
          />
        )}

        {/* 検索履歴ドロップダウン（入力が空でフォーカス時） */}
        {isFocused && !isDropdownOpen && value.trim() === '' && (
          <SearchHistoryDropdown
            recentSearches={recentSearches}
            favorites={favorites}
            isLoggedIn={!!user}
            onSelect={(name, tagLine, r) => {
              const query = `${name}#${tagLine}`;
              setValue(query);
              setRegion(r);
              handleSubmit(query);
            }}
            onRemoveRecent={(name, tagLine, r) => {
              removeRecentSearch(name, tagLine, r);
              setRecentSearches(getRecentSearches());
            }}
            onRemoveFavorite={async (id) => {
              await removeFavApi(id);
              setFavorites((prev) => prev.filter((f) => f.id !== id));
            }}
          />
        )}
      </div>

      {error && (
        <p className="text-red-500 text-sm px-2" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

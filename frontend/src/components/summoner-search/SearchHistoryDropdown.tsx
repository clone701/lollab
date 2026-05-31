'use client';

import { useState } from 'react';
import type { Region } from '@/types/summoner';
import type { RecentSearch } from '@/lib/recentSearches';
import type { FavoriteEntry } from '@/adapters/supabase/favorites';

interface SearchHistoryDropdownProps {
  recentSearches: RecentSearch[];
  favorites: FavoriteEntry[];
  isLoggedIn: boolean;
  onSelect: (name: string, tagLine: string, region: Region) => void;
  onRemoveRecent: (name: string, tagLine: string, region: Region) => void;
  onRemoveFavorite: (id: string) => void;
}

type Tab = 'recent' | 'favorites';

export default function SearchHistoryDropdown({
  recentSearches,
  favorites,
  isLoggedIn,
  onSelect,
  onRemoveRecent,
  onRemoveFavorite,
}: SearchHistoryDropdownProps) {
  const [activeTab, setActiveTab] = useState<Tab>('recent');

  return (
    <div
      className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-md z-50"
      onMouseDown={(e) => e.preventDefault()}
    >
      {/* タブ */}
      <div className="flex border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('recent')}
          className={`flex-1 py-2 text-sm font-medium ${
            activeTab === 'recent'
              ? 'text-blue-600 border-b-2 border-blue-500'
              : 'text-gray-500'
          }`}
        >
          最近の検索
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('favorites')}
          className={`flex-1 py-2 text-sm font-medium ${
            activeTab === 'favorites'
              ? 'text-blue-600 border-b-2 border-blue-500'
              : 'text-gray-500'
          }`}
        >
          お気に入り
        </button>
      </div>

      {/* コンテンツ */}
      <ul className="max-h-60 overflow-y-auto">
        {activeTab === 'recent' &&
          recentSearches.map((s) => (
            <li
              key={`${s.name}-${s.tagLine}-${s.region}`}
              className="flex items-center px-3 py-2 hover:bg-gray-50"
            >
              <span className="text-xs font-bold text-gray-500 bg-gray-100 rounded px-1 mr-2">
                {s.region}
              </span>
              <button
                type="button"
                onClick={() => onSelect(s.name, s.tagLine, s.region)}
                className="flex-1 text-left text-sm text-gray-800"
              >
                {s.name} <span className="text-gray-400">#{s.tagLine}</span>
              </button>
              <button
                type="button"
                onClick={() => onRemoveRecent(s.name, s.tagLine, s.region)}
                className="ml-2 text-gray-400 hover:text-red-500 text-sm"
                aria-label="削除"
              >
                ×
              </button>
            </li>
          ))}
        {activeTab === 'recent' && recentSearches.length === 0 && (
          <li className="px-3 py-4 text-center text-sm text-gray-400">
            検索履歴がありません
          </li>
        )}

        {activeTab === 'favorites' && !isLoggedIn && (
          <li className="px-3 py-4 text-center text-sm text-gray-400">
            ログインするとお気に入りを利用できます
          </li>
        )}
        {activeTab === 'favorites' &&
          isLoggedIn &&
          favorites.map((f) => (
            <li
              key={f.id}
              className="flex items-center px-3 py-2 hover:bg-gray-50"
            >
              <span className="text-xs font-bold text-gray-500 bg-gray-100 rounded px-1 mr-2">
                {f.region}
              </span>
              <button
                type="button"
                onClick={() =>
                  onSelect(f.summoner_name, f.tag_line, f.region as Region)
                }
                className="flex-1 text-left text-sm text-gray-800"
              >
                {f.summoner_name}{' '}
                <span className="text-gray-400">#{f.tag_line}</span>
              </button>
              <button
                type="button"
                onClick={() => onRemoveFavorite(f.id)}
                className="ml-2 text-yellow-500 hover:text-yellow-600 text-sm"
                aria-label="お気に入り解除"
              >
                ★
              </button>
              <button
                type="button"
                onClick={() => onRemoveFavorite(f.id)}
                className="ml-1 text-gray-400 hover:text-red-500 text-sm"
                aria-label="削除"
              >
                ×
              </button>
            </li>
          ))}
        {activeTab === 'favorites' && isLoggedIn && favorites.length === 0 && (
          <li className="px-3 py-4 text-center text-sm text-gray-400">
            お気に入りがありません
          </li>
        )}
      </ul>
    </div>
  );
}

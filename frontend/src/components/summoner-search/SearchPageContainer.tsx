'use client';

import { useState } from 'react';
import type { Region } from '@/types/summoner';
import SearchPage from './SearchPage';
import SearchResultPage from './SearchResultPage';

export default function SearchPageContainer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchRegion, setSearchRegion] = useState<Region>('JP');

  function handleSearch(query: string, region: Region) {
    setSearchQuery(query);
    setSearchRegion(region);
  }

  return searchQuery ? (
    <SearchResultPage
      query={searchQuery}
      region={searchRegion}
      onSearch={handleSearch}
    />
  ) : (
    <SearchPage onSearch={handleSearch} />
  );
}

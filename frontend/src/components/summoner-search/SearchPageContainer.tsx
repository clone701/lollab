'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { Region } from '@/types/summoner';
import { buildSearchHref, parseSearchParams } from '@/lib/summoner-search';
import SearchPage from './SearchPage';
import SearchResultPage from './SearchResultPage';

// 検索条件は URL のクエリ（region・q）で持つ。静的書き出しのため、ブラウザでクエリを読む
export default function SearchPageContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = parseSearchParams(
    searchParams.get('region'),
    searchParams.get('q')
  );

  // クエリを更新する（push なので、ブラウザの戻るで前のサモナーに戻れる）。空の検索は検索画面に戻す
  function handleSearch(query: string, region: Region) {
    router.push(query ? buildSearchHref(region, query) : '/');
  }

  return current ? (
    <SearchResultPage
      query={current.query}
      region={current.region}
      onSearch={handleSearch}
    />
  ) : (
    <SearchPage onSearch={handleSearch} />
  );
}

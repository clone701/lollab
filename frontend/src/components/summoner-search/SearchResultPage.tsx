'use client';

import { MatchDetailProvider } from '@/components/match-detail';
import type { Region } from '@/types/summoner';
import SearchResultContent from './SearchResultContent';

interface SearchResultPageProps {
  query: string;
  region: Region;
  onSearch: (query: string, region: Region) => void;
}

// 試合詳細のキャッシュを持つ。別のサモナーを検索すると key が変わり、キャッシュが消える
export default function SearchResultPage(props: SearchResultPageProps) {
  return (
    <MatchDetailProvider key={`${props.region}/${props.query}`}>
      <SearchResultContent {...props} />
    </MatchDetailProvider>
  );
}

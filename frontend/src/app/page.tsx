import { Suspense } from 'react';
import { SearchPageContainer } from '@/components/summoner-search';

export default function HomePage() {
  // useSearchParams を使う子は静的書き出しのため Suspense で囲む
  return (
    <Suspense
      fallback={<p className="py-8 text-center text-fg-muted">読み込み中...</p>}
    >
      <SearchPageContainer />
    </Suspense>
  );
}

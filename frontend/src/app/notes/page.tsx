import { Suspense } from 'react';
import GlobalLoading from '@/components/GlobalLoading';
import { NotesPageContainer } from './NotesPageContainer';

export default function NotesPage() {
  // useSearchParams を使う子は静的書き出しのため Suspense で囲む
  return (
    <Suspense fallback={<GlobalLoading loading={true} />}>
      <NotesPageContainer />
    </Suspense>
  );
}

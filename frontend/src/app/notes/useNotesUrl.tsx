'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { buildNotesHref, parseNotesParams } from '@/lib/notes';
import type { NotesParams } from '@/lib/notes';

/** URL のクエリ（tab・my・enemy）を検証して返す。履歴を増やさずに更新する関数も返す */
export function useNotesUrl(): {
  params: NotesParams;
  replaceUrl: (next: NotesParams) => void;
} {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = parseNotesParams(
    searchParams.get('tab'),
    searchParams.get('my'),
    searchParams.get('enemy')
  );
  const replaceUrl = (next: NotesParams): void => {
    router.replace(buildNotesHref(next));
  };
  return { params, replaceUrl };
}

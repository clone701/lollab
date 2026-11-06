import type { MatchDetailResponse } from '@/types/matchDetail';
import { ApiAuthError, apiFetch } from '@/lib/api';
import {
  MATCH_DETAIL_FAILED_MESSAGE,
  toMatchDetailErrorMessage,
} from './matchDetailError';

/** 試合詳細を取得する。失敗時は画面表示用のメッセージで throw する */
export async function fetchMatchDetail(
  matchId: string,
  signal?: AbortSignal
): Promise<MatchDetailResponse> {
  let res: Response;
  try {
    res = await apiFetch(`/api/match/${encodeURIComponent(matchId)}`, {
      signal,
    });
  } catch (e: unknown) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e;
    if (e instanceof ApiAuthError) throw e;
    throw new Error(MATCH_DETAIL_FAILED_MESSAGE);
  }
  if (!res.ok) throw new Error(toMatchDetailErrorMessage(res.status));
  return (await res.json()) as MatchDetailResponse;
}

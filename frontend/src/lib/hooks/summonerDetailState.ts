import type { UseSummonerDetailResult } from '@/types/summoner';

export type SummonerDetailState = Omit<UseSummonerDetailResult, 'update'>;

// 取得対象が変わったときに戻す、取得前の状態
export const INITIAL_SUMMONER_DETAIL_STATE: SummonerDetailState = {
  detail: null,
  isLoading: true,
  error: null,
  isUpdating: false,
  updateError: null,
};

// 渡された項目だけを上書きした新しい状態を返す
export function mergeSummonerDetailState(
  state: SummonerDetailState,
  patch: Partial<SummonerDetailState>
): SummonerDetailState {
  return { ...state, ...patch };
}

import { act, renderHook } from '@testing-library/react';
import { fetchChampionData, fetchSkillValues } from '@/adapters/game-data';
import urgotFixture from '@/lib/game-data/__fixtures__/urgot.json';
import { useChampionDetail } from '..';

// loadOnce のキャッシュがテスト間で残らないよう、adapters をモックする
jest.mock('@/adapters/game-data', () => ({
  fetchItemData: jest.fn(),
  fetchRuneData: jest.fn(),
  fetchSummonerData: jest.fn(),
  fetchChampionData: jest.fn(),
  fetchSkillValues: jest.fn(),
}));
const mockFetchChampionData = fetchChampionData as jest.Mock;
const mockFetchSkillValues = fetchSkillValues as jest.Mock;

const VALUES = {
  version: '16.21.1',
  passive: 'パッシブの文',
  spells: ['25/70/115/160/205 のダメージ', null, null, null],
};

describe('useChampionDetail', () => {
  beforeEach(() => {
    mockFetchChampionData.mockReset();
    mockFetchSkillValues.mockReset();
  });

  it('両方取れたら skills に数値入りの文が入り、champion も返す', async () => {
    mockFetchChampionData.mockResolvedValue(urgotFixture);
    mockFetchSkillValues.mockResolvedValue(VALUES);
    const { result } = renderHook(() => useChampionDetail('Urgot'));
    await act(async () => {});
    expect(mockFetchChampionData).toHaveBeenCalledWith('Urgot');
    expect(mockFetchSkillValues).toHaveBeenCalledWith('Urgot');
    expect(result.current.skills?.map((s) => s.key)).toEqual([
      'P',
      'Q',
      'W',
      'E',
      'R',
    ]);
    expect(result.current.skills?.[1].detail).toBe(
      '25/70/115/160/205 のダメージ'
    );
    expect(result.current.champion?.title).toBe('ドレッドノート');
  });

  it('結果のファイルが無い（null）ときも skills は出て、detail は null', async () => {
    mockFetchChampionData.mockResolvedValue(urgotFixture);
    mockFetchSkillValues.mockResolvedValue(null);
    const { result } = renderHook(() => useChampionDetail('Urgot'));
    await act(async () => {});
    expect(result.current.skills).toHaveLength(5);
    expect(result.current.skills?.every((s) => s.detail === null)).toBe(true);
  });

  it('結果のファイルだけ失敗しても skills と champion は出る', async () => {
    mockFetchChampionData.mockResolvedValue(urgotFixture);
    mockFetchSkillValues.mockRejectedValue(new Error('network'));
    const { result } = renderHook(() => useChampionDetail('Urgot'));
    await act(async () => {});
    expect(result.current.skills).toHaveLength(5);
    expect(result.current.skills?.every((s) => s.detail === null)).toBe(true);
    expect(result.current.champion).not.toBeNull();
  });

  it('チャンピオンの JSON が失敗したら両方 null', async () => {
    mockFetchChampionData.mockRejectedValue(new Error('network'));
    mockFetchSkillValues.mockResolvedValue(VALUES);
    const { result } = renderHook(() => useChampionDetail('Urgot'));
    await act(async () => {});
    expect(result.current).toEqual({ skills: null, champion: null });
  });

  it('読み込み前と championId が null のときは両方 null で、取得しない', async () => {
    mockFetchChampionData.mockReturnValue(new Promise(() => {}));
    mockFetchSkillValues.mockReturnValue(new Promise(() => {}));
    const loading = renderHook(() => useChampionDetail('Urgot'));
    expect(loading.result.current).toEqual({ skills: null, champion: null });
    mockFetchChampionData.mockClear();
    const none = renderHook(() => useChampionDetail(null));
    await act(async () => {});
    expect(none.result.current).toEqual({ skills: null, champion: null });
    expect(mockFetchChampionData).not.toHaveBeenCalled();
  });
});

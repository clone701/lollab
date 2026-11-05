import { formatTimeAgo } from '@/lib/summoner-search';

// 境界値テスト（60秒未満は既存ロジックどおり「0分前」）
describe('formatTimeAgo 境界値', () => {
  it.each([
    [59, '0分前'],
    [60, '1分前'],
    [3599, '59分前'],
    [3600, '1時間前'],
    [86399, '23時間前'],
    [86400, '1日前'],
  ])('%i秒 → %s', (seconds, expected) => {
    expect(formatTimeAgo(seconds)).toBe(expected);
  });
});

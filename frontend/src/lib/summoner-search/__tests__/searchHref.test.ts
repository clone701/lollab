import { buildSearchHref, parseSearchParams } from '..';

describe('buildSearchHref', () => {
  it('region と q（encodeURIComponent）のクエリを作る', () => {
    expect(buildSearchHref('JP', 'a b#JP1')).toBe('/?region=JP&q=a%20b%23JP1');
  });
});

describe('parseSearchParams', () => {
  it('region と q があれば検索条件にする', () => {
    expect(parseSearchParams('KR', 'Hide on bush#KR1')).toEqual({
      region: 'KR',
      query: 'Hide on bush#KR1',
    });
  });

  it('buildSearchHref の URL を読み戻すと元の値になる', () => {
    const url = new URL(buildSearchHref('EUW', 'あ い#タグ'), 'http://x');
    expect(
      parseSearchParams(
        url.searchParams.get('region'),
        url.searchParams.get('q')
      )
    ).toEqual({ region: 'EUW', query: 'あ い#タグ' });
  });

  it.each([
    [null, 'a#JP1'],
    ['JP', null],
    ['XX', 'a#JP1'],
    ['constructor', 'a#JP1'],
    ['JP', ''],
    ['JP', '   '],
    ['JP', 'a'.repeat(101)],
  ])('region=%p q=%p は null（検索画面を出す）', (region, q) => {
    expect(parseSearchParams(region, q)).toBeNull();
  });
});

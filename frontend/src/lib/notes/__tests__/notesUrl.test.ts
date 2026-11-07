import { buildNotesHref, parseNotesParams } from '..';

describe('buildNotesHref', () => {
  it('対策ノートへのリンクを作る', () => {
    expect(buildNotesHref({ tab: 'matchup', my: 'Ahri', enemy: 'Zed' })).toBe(
      '/notes?tab=matchup&my=Ahri&enemy=Zed'
    );
  });

  it('未指定の my・enemy は含めない', () => {
    expect(buildNotesHref({ tab: 'mypick' })).toBe('/notes?tab=mypick');
    expect(buildNotesHref({ tab: 'matchup', my: null, enemy: 'Zed' })).toBe(
      '/notes?tab=matchup&enemy=Zed'
    );
  });

  it('作ったリンクを parseNotesParams で読み戻せる', () => {
    const url = new URL(
      buildNotesHref({ tab: 'matchup', my: 'Ahri', enemy: 'Zed' }),
      'http://localhost'
    );
    expect(
      parseNotesParams(
        url.searchParams.get('tab'),
        url.searchParams.get('my'),
        url.searchParams.get('enemy')
      )
    ).toEqual({ tab: 'matchup', my: 'Ahri', enemy: 'Zed' });
  });
});

describe('parseNotesParams', () => {
  it('正しい値はそのまま返す', () => {
    expect(parseNotesParams('mypick', 'Ahri', 'Zed')).toEqual({
      tab: 'mypick',
      my: 'Ahri',
      enemy: 'Zed',
    });
    expect(parseNotesParams('general', null, null).tab).toBe('general');
  });

  it('tab がない・不正なら対策ノートタブ', () => {
    expect(parseNotesParams(null, null, null).tab).toBe('matchup');
    expect(parseNotesParams('unknown', null, null).tab).toBe('matchup');
  });

  it('champions.ts にない id は無視する', () => {
    expect(parseNotesParams('matchup', 'NotAChampion', 'Zed')).toEqual({
      tab: 'matchup',
      my: null,
      enemy: 'Zed',
    });
    expect(parseNotesParams('matchup', 'Ahri', '<script>').enemy).toBeNull();
    expect(parseNotesParams('matchup', 'ahri', '').my).toBeNull();
  });
});

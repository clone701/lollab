import type { Champion } from '@/types/champion';
import {
  buildChampionBuildHref,
  filterChampions,
  parseBuildQuery,
  toRiotChampionName,
} from '..';

describe('parseBuildQuery', () => {
  it('未指定は既定値（latest_patch / all、role なし）', () => {
    expect(parseBuildQuery({})).toEqual({
      role: undefined,
      period: 'latest_patch',
      queue: 'all',
    });
  });

  it('有効な値はそのまま使う', () => {
    expect(
      parseBuildQuery({ role: 'JUNGLE', period: 'last_30_days', queue: 'flex' })
    ).toEqual({ role: 'JUNGLE', period: 'last_30_days', queue: 'flex' });
  });

  it('不正な値は既定値に戻す', () => {
    expect(
      parseBuildQuery({ role: 'constructor', period: 'x', queue: 'y' })
    ).toEqual({ role: undefined, period: 'latest_patch', queue: 'all' });
  });

  it('配列で渡された場合は先頭を使う', () => {
    expect(parseBuildQuery({ period: ['all', 'latest_patch'] }).period).toBe(
      'all'
    );
  });
});

describe('buildChampionBuildHref', () => {
  it('既定値のクエリは含めない', () => {
    expect(
      buildChampionBuildHref('Ahri', { period: 'latest_patch', queue: 'all' })
    ).toBe('/champion/Ahri');
  });

  it('role・period・queue をクエリにする', () => {
    expect(
      buildChampionBuildHref('Ahri', {
        role: 'MIDDLE',
        period: 'all',
        queue: 'solo',
      })
    ).toBe('/champion/Ahri?role=MIDDLE&period=all&queue=solo');
  });
});

describe('toRiotChampionName', () => {
  it('Riot の名前が異なるチャンピオンだけ変換する', () => {
    expect(toRiotChampionName('Wukong')).toBe('MonkeyKing');
    expect(toRiotChampionName('Ahri')).toBe('Ahri');
  });
});

describe('filterChampions', () => {
  const list: Champion[] = [
    { id: 'LeeSin', name: 'リー・シン', imagePath: '', reading: 'りーしん' },
    { id: 'Ahri', name: 'アーリ', imagePath: '', reading: 'あーり' },
    {
      id: 'Aatrox',
      name: 'エイトロックス',
      imagePath: '',
      reading: 'えいとろっくす',
    },
  ];
  const ids = (q: string): string[] =>
    filterChampions(list, q).map((c) => c.id);

  it('空・空白だけの入力は全件', () => {
    expect(ids('')).toHaveLength(3);
    expect(ids('  ')).toHaveLength(3);
  });

  it('日本語名（部分一致）で絞り込む', () => {
    expect(ids('シン')).toEqual(['LeeSin']);
  });

  it('読み（ひらがな）で絞り込む', () => {
    expect(ids('えいと')).toEqual(['Aatrox']);
  });

  it('カタカナ入力でも読みに一致する', () => {
    expect(ids('ルーリ')).toEqual([]);
    expect(ids('アーリ')).toEqual(['Ahri']);
  });

  it('英語 ID は大文字小文字を区別しない', () => {
    expect(ids('LEESIN')).toEqual(['LeeSin']);
    expect(ids('ahri')).toEqual(['Ahri']);
  });

  it('一致しなければ空', () => {
    expect(ids('zzz')).toEqual([]);
  });
});

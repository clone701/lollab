import { champions } from '@/lib/data/champions';
import { CHAMPIONS_BY_READING, sortByReading } from '..';
import { readingKey } from '../sortByReading';

describe('チャンピオンの五十音順', () => {
  it('読みの五十音順に並べ、元の配列は変えない', () => {
    const list = champions.filter((c) =>
      ['Urgot', 'Ahri', 'Aatrox'].includes(c.id)
    );
    const before = list.map((c) => c.id);

    // あーごっと → あーり → えいとろっくす
    expect(sortByReading(list).map((c) => c.id)).toEqual([
      'Urgot',
      'Ahri',
      'Aatrox',
    ]);
    expect(list.map((c) => c.id)).toEqual(before);
  });

  it('全チャンピオンの一覧は五十音順で、件数は変わらない', () => {
    expect(CHAMPIONS_BY_READING).toHaveLength(champions.length);
    const keys = CHAMPIONS_BY_READING.map(readingKey);
    const sorted = [...keys].sort((a, b) => a.localeCompare(b, 'ja'));
    expect(keys).toEqual(sorted);
  });
});

import { existsSync } from 'fs';
import path from 'path';
import { getRuneIcon, getSpellIcon, itemIconUrls } from '..';

const PUBLIC_DIR = path.join(process.cwd(), 'public');

function fileExists(src: string): boolean {
  return existsSync(path.join(PUBLIC_DIR, src));
}

describe('getRuneIcon', () => {
  it('Data Dragon の主要なルーン・スタイル・シャードの画像が実在する', () => {
    const ids = [
      8112, 8128, 9923, 8010, 8005, 8214, 8437, 8351, 8299, 8242, 8410, 8230,
      8000, 8100, 8200, 8300, 8400, 5001, 5002, 5003, 5005, 5007, 5008, 5010,
      5011, 5013,
    ];
    for (const id of ids) {
      const icon = getRuneIcon(id);
      expect(icon).not.toBeNull();
      expect(fileExists(icon!.src)).toBe(true);
    }
  });

  it('Resolve は 8400、Inspiration は 8300 の画像を使う', () => {
    expect(getRuneIcon(8400)?.name).toBe('Resolve');
    expect(getRuneIcon(8300)?.name).toBe('Inspiration');
  });

  it('未知の ID は null', () => {
    expect(getRuneIcon(1)).toBeNull();
  });
});

describe('getSpellIcon', () => {
  it('主要なスペルの画像が実在する', () => {
    const names: Record<number, string> = {
      4: 'Flash',
      14: 'Ignite',
      12: 'Teleport',
      11: 'Smite',
      7: 'Heal',
      3: 'Exhaust',
      21: 'Barrier',
      1: 'Cleanse',
      6: 'Ghost',
    };
    for (const [id, name] of Object.entries(names)) {
      const icon = getSpellIcon(Number(id));
      expect(icon?.name).toBe(name);
      expect(fileExists(icon!.src)).toBe(true);
    }
  });

  it('未知の ID は null', () => {
    expect(getSpellIcon(999)).toBeNull();
  });
});

describe('itemIconUrls', () => {
  it('ローカル画像と Data Dragon の URL を返す', () => {
    const { src, fallbackSrc } = itemIconUrls(3089);
    expect(src).toBe('/images/item/3089.png');
    expect(fileExists(src)).toBe(true);
    expect(fallbackSrc).toMatch(
      /^https:\/\/ddragon\.leagueoflegends\.com\/cdn\/[\d.]+\/img\/item\/3089\.png$/
    );
  });
});

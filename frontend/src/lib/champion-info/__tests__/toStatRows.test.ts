import urgotFixture from '@/lib/game-data/__fixtures__/urgot.json';
import { toStatRows } from '..';

const { stats, partype } = urgotFixture.data.Urgot;

describe('toStatRows', () => {
  const rows = toStatRows(stats, partype);

  it('行の順と名前（リソースの名前は partype）', () => {
    expect(rows.map((r) => r.label)).toEqual([
      '体力',
      'マナ',
      '物理防御',
      '魔法防御',
      '移動速度',
      '攻撃力',
      '攻撃速度',
      '体力自動回復',
      'マナ自動回復',
      '射程',
    ]);
  });

  it('アーゴットの Lv.1・成長・Lv.18', () => {
    const byLabel = Object.fromEntries(rows.map((r) => [r.label, r]));
    expect(byLabel['体力']).toEqual({
      label: '体力',
      base: '655',
      growth: '+102',
      max: '2389',
    });
    expect(byLabel['物理防御']).toMatchObject({ growth: '+5', max: '121' });
    expect(byLabel['魔法防御']).toMatchObject({
      base: '32',
      growth: '+2.05',
      max: '66.85',
    });
    expect(byLabel['攻撃速度']).toEqual({
      label: '攻撃速度',
      base: '0.625',
      growth: '+3.75%',
      max: '1.023',
    });
    expect(byLabel['体力自動回復']).toMatchObject({
      base: '7.5',
      growth: '+0.7',
      max: '19.4',
    });
  });

  it('移動速度・射程は成長と Lv.18 が無い', () => {
    const fixed = rows.filter((r) => ['移動速度', '射程'].includes(r.label));
    expect(fixed).toEqual([
      { label: '移動速度', base: '330', growth: null, max: null },
      { label: '射程', base: '350', growth: null, max: null },
    ]);
  });

  it('リソースが「なし」ならリソースの行を除く', () => {
    const noResource = toStatRows(stats, 'なし').map((r) => r.label);
    expect(noResource).toHaveLength(8);
    expect(noResource).not.toContain('なし');
    expect(noResource).not.toContain('なし自動回復');
    expect(noResource).toContain('体力自動回復');
  });

  it('リソースの名前が違えば行の名前も変わる', () => {
    const labels = toStatRows(stats, '気').map((r) => r.label);
    expect(labels).toContain('気');
    expect(labels).toContain('気自動回復');
  });
});

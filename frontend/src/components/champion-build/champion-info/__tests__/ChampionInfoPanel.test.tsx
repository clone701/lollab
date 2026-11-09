import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ChampionDetail } from '@/components/game-data';
import { toChampionSkills } from '@/lib/game-data';
import urgotFixture from '@/lib/game-data/__fixtures__/urgot.json';
import { ChampionInfoPanel } from '..';

const URGOT = urgotFixture.data.Urgot;
const DETAIL: ChampionDetail = {
  skills: toChampionSkills(urgotFixture, {
    version: '16.21.1',
    passive: '脚から<physicalDamage>40〜100%の物理ダメージ</physicalDamage>',
    spells: [
      '榴弾を発射して<physicalDamage>25/70/115/160/205</physicalDamage>',
      null,
      null,
      null,
    ],
  }),
  champion: URGOT,
};

function rowOf(label: string): HTMLElement {
  const row = screen.getByRole('rowheader', { name: label }).closest('tr');
  if (!row) throw new Error(`row not found: ${label}`);
  return row;
}

describe('ChampionInfoPanel: 開閉', () => {
  it('見出し「基礎情報」と開閉ボタンがあり、最初は開いている', () => {
    render(<ChampionInfoPanel detail={DETAIL} />);
    expect(
      screen.getByRole('heading', { name: '基礎情報' })
    ).toBeInTheDocument();
    const button = screen.getByRole('button', { name: '閉じる' });
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('table')).toHaveLength(2);
    const controlsId = button.getAttribute('aria-controls') ?? '';
    expect(document.getElementById(controlsId)).toBeInTheDocument();
  });

  it('閉じると中身が無くなり、もう一度押すと開く', async () => {
    render(<ChampionInfoPanel detail={DETAIL} />);
    await userEvent.click(screen.getByRole('button', { name: '閉じる' }));
    const button = screen.getByRole('button', { name: '開く' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByRole('meter')).not.toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '基礎情報' })).toBeVisible();
    await userEvent.click(button);
    expect(screen.getAllByRole('table')).toHaveLength(2);
  });
});

describe('ChampionInfoPanel: 特性の横棒', () => {
  it('攻撃・防御・魔力・難易度の値を出す（アーゴット 8・5・3・8）', () => {
    render(<ChampionInfoPanel detail={DETAIL} />);
    const meters = screen.getAllByRole('meter');
    expect(
      meters.map((m) => [
        m.getAttribute('aria-label'),
        m.getAttribute('aria-valuenow'),
        m.getAttribute('aria-valuemax'),
      ])
    ).toEqual([
      ['攻撃', '8', '10'],
      ['防御', '5', '10'],
      ['魔力', '3', '10'],
      ['難易度', '8', '10'],
    ]);
    expect(meters[0].firstElementChild).toHaveStyle({ width: '80%' });
    expect(meters[0].firstElementChild).toHaveClass('bg-game-physical');
  });
});

describe('ChampionInfoPanel: ステータスの表', () => {
  it('見出し行と、アーゴットの値（Lv.1・成長・Lv.18）を出す', () => {
    render(<ChampionInfoPanel detail={DETAIL} />);
    const [first] = screen.getAllByRole('table');
    expect(
      within(first)
        .getAllByRole('columnheader')
        .map((h) => h.textContent)
    ).toEqual(['ステータス', 'Lv.1', '成長', 'Lv.18']);
    expect(
      within(rowOf('体力'))
        .getAllByRole('cell')
        .map((c) => c.textContent)
    ).toEqual(['655', '+102', '2389']);
    expect(
      within(rowOf('マナ'))
        .getAllByRole('cell')
        .map((c) => c.textContent)
    ).toEqual(['340', '+45', '1105']);
    expect(
      within(rowOf('攻撃速度'))
        .getAllByRole('cell')
        .map((c) => c.textContent)
    ).toEqual(['0.625', '+3.75%', '1.023']);
  });

  it('Lv.18 は強調し、成長は控えめの色にする', () => {
    render(<ChampionInfoPanel detail={DETAIL} />);
    const [base, growth, max] = within(rowOf('物理防御')).getAllByRole('cell');
    expect(max).toHaveTextContent('121');
    expect(max).toHaveClass('font-semibold', 'text-game-number');
    expect(growth).toHaveClass('text-fg-subtle');
    expect(base).not.toHaveClass('text-game-number');
  });

  it('移動速度・射程は成長と Lv.18 が「-」', () => {
    render(<ChampionInfoPanel detail={DETAIL} />);
    expect(
      within(rowOf('射程'))
        .getAllByRole('cell')
        .map((c) => c.textContent)
    ).toEqual(['350', '-', '-']);
    expect(within(rowOf('移動速度')).getAllByRole('cell')[0]).toHaveTextContent(
      '330'
    );
  });

  it('リソースが「なし」ならリソースの行が無い', () => {
    const noResource = { ...DETAIL, champion: { ...URGOT, partype: 'なし' } };
    render(<ChampionInfoPanel detail={noResource} />);
    expect(screen.queryByRole('rowheader', { name: 'マナ' })).toBeNull();
    expect(screen.getAllByRole('rowheader')).toHaveLength(8);
  });

  it('2列の表は狭い画面で1列になるクラスを持つ', () => {
    render(<ChampionInfoPanel detail={DETAIL} />);
    const grid = screen.getAllByRole('table')[0].parentElement;
    expect(grid).toHaveClass('grid', 'md:grid-cols-2');
  });
});

describe('ChampionInfoPanel: スキル', () => {
  function skillItems(): HTMLElement[] {
    return within(screen.getByRole('list', { name: 'スキル' })).getAllByRole(
      'listitem'
    );
  }

  it('P・Q・W・E・R の順に並ぶ', () => {
    render(<ChampionInfoPanel detail={DETAIL} />);
    expect(
      screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    ).toEqual([
      'Pエコーフレイム',
      'Qコラプトシェル',
      'Wパージ',
      'Eディスデイン',
      'Rデスグラインダー',
    ]);
    expect(skillItems()).toHaveLength(5);
  });

  it('Q は CD・コスト・射程と、数値入りの説明文を出す', () => {
    render(<ChampionInfoPanel detail={DETAIL} />);
    const q = within(skillItems()[1]);
    expect(q.getByText('CD').nextSibling).toHaveTextContent(
      '10/9.5/9/8.5/8 秒'
    );
    expect(q.getByText('コスト').nextSibling).toHaveTextContent('70 マナ');
    expect(q.getByText('射程').nextSibling).toHaveTextContent('800');
    expect(skillItems()[1]).toHaveTextContent(
      '榴弾を発射して25/70/115/160/205'
    );
    expect(q.getByAltText('コラプトシェル')).toBeInTheDocument();
  });

  it('パッシブは CD・コスト・射程が無く、数値入りの説明文を出す', () => {
    render(<ChampionInfoPanel detail={DETAIL} />);
    const passive = within(skillItems()[0]);
    expect(passive.queryByText('CD')).not.toBeInTheDocument();
    expect(passive.queryByText('コスト')).not.toBeInTheDocument();
    expect(passive.queryByText('射程')).not.toBeInTheDocument();
    expect(skillItems()[0]).toHaveTextContent('脚から40〜100%の物理ダメージ');
  });

  it('数値入りの文が無い（null）スキルは概要を出す', () => {
    render(<ChampionInfoPanel detail={DETAIL} />);
    expect(skillItems()[2]).toHaveTextContent('最も近くにいる敵に速射攻撃');
  });

  it('名前は text-highlight で出す', () => {
    render(<ChampionInfoPanel detail={DETAIL} />);
    expect(screen.getByText('コラプトシェル')).toHaveClass('text-highlight');
  });
});

describe('ChampionInfoPanel: 読み込み前・失敗', () => {
  it('champion が null なら何も出さず、壊れない', () => {
    const { container } = render(
      <ChampionInfoPanel detail={{ skills: null, champion: null }} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('skills が null でも特性と表は出て、スキルの一覧だけ無い', () => {
    render(<ChampionInfoPanel detail={{ ...DETAIL, skills: null }} />);
    expect(screen.getAllByRole('meter')).toHaveLength(4);
    expect(screen.getAllByRole('table')).toHaveLength(2);
    expect(screen.queryByRole('list', { name: 'スキル' })).toBeNull();
  });
});

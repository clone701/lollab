import { render, screen, within } from '@testing-library/react';
import type { BuildElement } from '@/types/championBuild';
import { SpellPanel } from '../SpellPanel';

// 採用率の分母は要素の games（443 / 878 ≒ 50.5% → 50%）
const TWO: BuildElement = {
  games: 878,
  options: [
    { key: [4, 14], games: 443, wins: 221 },
    { key: [4, 12], games: 200, wins: 90 },
    { key: [4, 3], games: 100, wins: 40 },
  ],
};

describe('SpellPanel', () => {
  it('上位2件を2行で並べ、3件目は出さない', () => {
    render(<SpellPanel spells={TWO} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByAltText('Ignite')).toBeInTheDocument();
    expect(screen.getByAltText('Teleport')).toBeInTheDocument();
    expect(screen.queryByAltText('Exhaust')).not.toBeInTheDocument();
  });

  it('各行に勝率・試合数・採用率（試合数 / 要素の試合数）を出す', () => {
    render(<SpellPanel spells={TWO} />);
    const [first, second] = screen.getAllByRole('listitem');
    expect(within(first).getByText('勝率 49.9%')).toBeInTheDocument();
    expect(within(first).getByText('443試合')).toBeInTheDocument();
    expect(within(first).getByText('50%')).toBeInTheDocument();
    expect(within(first).getByRole('meter')).toHaveAttribute(
      'aria-valuenow',
      '50'
    );
    expect(within(second).getByText('23%')).toBeInTheDocument(); // 200 / 878
    expect(within(second).getByRole('meter')).toHaveAttribute(
      'aria-valuenow',
      '23'
    );
  });

  it('採用率の棒は bg-line の上に bg-accent を採用率の幅で重ねる', () => {
    render(<SpellPanel spells={TWO} />);
    const meter = screen.getAllByRole('meter')[0];
    expect(meter).toHaveClass('h-1.5', 'rounded-full', 'bg-line');
    expect(meter.firstElementChild).toHaveClass('bg-accent');
    expect(meter.firstElementChild).toHaveStyle({ width: '50%' });
  });

  it('1件目の行だけ bg-surface-2', () => {
    render(<SpellPanel spells={TWO} />);
    const [first, second] = screen.getAllByRole('listitem');
    expect(first).toHaveClass('bg-surface-2');
    expect(second).not.toHaveClass('bg-surface-2');
  });

  it('1件だけなら1行', () => {
    const one = { games: 10, options: [TWO.options[0]] };
    render(<SpellPanel spells={one} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('選択肢がなければ「データなし」', () => {
    render(<SpellPanel spells={{ games: 0, options: [] }} />);
    expect(screen.getByText('データなし')).toBeInTheDocument();
    expect(screen.queryByRole('meter')).not.toBeInTheDocument();
  });
});

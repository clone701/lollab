import { render, screen } from '@testing-library/react';
import urgotFixture from '@/lib/game-data/__fixtures__/urgot.json';
import { getChampionById } from '@/lib/utils/championHelpers';
import { ChampionBuildHeader } from '../ChampionBuildHeader';

const CHAMPION = getChampionById('Urgot');

function renderHeader(hasDetail: boolean): void {
  if (!CHAMPION) throw new Error('champion not found');
  render(
    <ChampionBuildHeader
      champion={CHAMPION}
      detail={{
        skills: null,
        champion: hasDetail ? urgotFixture.data.Urgot : null,
      }}
    />
  );
}

describe('ChampionBuildHeader', () => {
  it('名前の横に称号と役割（ファイター・タンク）の札を出す', () => {
    renderHeader(true);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'アーゴット'
    );
    expect(screen.getByText('ドレッドノート')).toHaveClass('text-fg-muted');
    const fighter = screen.getByText('ファイター');
    expect(fighter).toHaveClass('rounded-full', 'bg-surface-2');
    expect(screen.getByText('タンク')).toBeInTheDocument();
  });

  it('基礎情報のカードが名前の下に出る', () => {
    renderHeader(true);
    const name = screen.getByRole('heading', { level: 1 });
    const panel = screen.getByRole('heading', { name: '基礎情報' });
    expect(
      name.compareDocumentPosition(panel) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('ロールのタブと概要の値は出さない（「ビルドの集計」カードに移した）', () => {
    renderHeader(true);
    expect(
      screen.queryByRole('navigation', { name: 'ロール' })
    ).not.toBeInTheDocument();
    expect(screen.queryByText('勝率')).not.toBeInTheDocument();
  });

  it('基礎情報が読み込めていなくても名前は出て、札と基礎情報は出ない', () => {
    renderHeader(false);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.queryByText('ドレッドノート')).not.toBeInTheDocument();
    expect(screen.queryByText('ファイター')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: '基礎情報' })
    ).not.toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import urgotFixture from '@/lib/game-data/__fixtures__/urgot.json';
import { getChampionById } from '@/lib/utils/championHelpers';
import { makeBuildResponse } from '../__fixtures__/buildResponse';
import { ChampionBuildHeader } from '../ChampionBuildHeader';

const CHAMPION = getChampionById('Urgot');
const DATA = makeBuildResponse();
const QUERY = { period: 'latest_patch', queue: 'all', rank: 'all' } as const;

function renderHeader(hasDetail: boolean): void {
  if (!CHAMPION) throw new Error('champion not found');
  render(
    <ChampionBuildHeader
      champion={CHAMPION}
      role={DATA.role}
      roles={DATA.roles}
      summary={DATA.summary}
      query={QUERY}
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

  it('基礎情報のカードが名前の下、ロールのタブの上に出る', () => {
    renderHeader(true);
    const name = screen.getByRole('heading', { level: 1 });
    const panel = screen.getByRole('heading', { name: '基礎情報' });
    const tabs = screen.getByRole('navigation', { name: 'ロール' });
    expect(
      name.compareDocumentPosition(panel) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      panel.compareDocumentPosition(tabs) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('基礎情報が読み込めていなくても名前とタブは出て、札と基礎情報は出ない', () => {
    renderHeader(false);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'ロール' })).toBeVisible();
    expect(screen.queryByText('ドレッドノート')).not.toBeInTheDocument();
    expect(screen.queryByText('ファイター')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: '基礎情報' })
    ).not.toBeInTheDocument();
  });
});

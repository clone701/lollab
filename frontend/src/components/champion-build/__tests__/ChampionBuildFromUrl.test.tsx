import { render, screen } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import { ChampionBuildFromUrl } from '../ChampionBuildFromUrl';

jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
  useRouter: () => ({ replace: jest.fn() }),
}));
jest.mock('../ChampionBuildContent', () => ({
  ChampionBuildContent: ({ query }: { query: unknown }) => (
    <pre data-testid="query">{JSON.stringify(query)}</pre>
  ),
}));

const AHRI = {
  id: 'Ahri',
  name: 'アーリ',
  imagePath: '/images/champion/Ahri.png',
  reading: 'あーり',
};

function renderWithQuery(query: string): unknown {
  jest
    .mocked(useSearchParams)
    .mockReturnValue(
      new URLSearchParams(query) as unknown as ReturnType<
        typeof useSearchParams
      >
    );
  render(<ChampionBuildFromUrl champion={AHRI} />);
  return JSON.parse(screen.getByTestId('query').textContent ?? '{}');
}

describe('ChampionBuildFromUrl', () => {
  it('URL のクエリ（role・period・queue）をビルドの条件にする', () => {
    const query = renderWithQuery('role=MIDDLE&period=all&queue=solo');
    expect(query).toEqual({ role: 'MIDDLE', period: 'all', queue: 'solo' });
  });

  it('クエリがなければ既定の条件にする', () => {
    const query = renderWithQuery('');
    expect(query).toEqual({ period: 'latest_patch', queue: 'all' });
  });
});

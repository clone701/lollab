import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import SearchPageContainer from '../SearchPageContainer';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));
jest.mock('../SearchPage', () => ({
  __esModule: true,
  default: ({ onSearch }: { onSearch: (q: string, r: string) => void }) => (
    <button onClick={() => onSearch('Hide on bush#KR1', 'KR')}>検索画面</button>
  ),
}));
jest.mock('../SearchResultPage', () => ({
  __esModule: true,
  default: ({
    query,
    region,
    onSearch,
  }: {
    query: string;
    region: string;
    onSearch: (q: string, r: string) => void;
  }) => (
    <div>
      <p data-testid="result">{`${region}|${query}`}</p>
      <button onClick={() => onSearch('', region)}>戻る</button>
      <button onClick={() => onSearch('Faker#KR1', region)}>別の検索</button>
    </div>
  ),
}));

const push = jest.fn();

function renderWithQuery(query: string): void {
  jest
    .mocked(useSearchParams)
    .mockReturnValue(
      new URLSearchParams(query) as unknown as ReturnType<
        typeof useSearchParams
      >
    );
  render(<SearchPageContainer />);
}

describe('SearchPageContainer: URL のクエリ', () => {
  beforeEach(() => {
    push.mockReset();
    jest
      .mocked(useRouter)
      .mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
  });

  it('region と q があれば検索結果を表示する', () => {
    renderWithQuery('region=KR&q=Hide%20on%20bush%23KR1');
    expect(screen.getByTestId('result')).toHaveTextContent(
      'KR|Hide on bush#KR1'
    );
  });

  it('クエリがなければ検索画面を表示する', () => {
    renderWithQuery('');
    expect(screen.getByText('検索画面')).toBeInTheDocument();
    expect(screen.queryByTestId('result')).toBeNull();
  });

  it.each(['region=KR', 'q=a%23JP1', 'region=XX&q=a%23JP1', 'region=JP&q=%20'])(
    '不正なクエリ（%s）は検索画面を表示する',
    (query) => {
      renderWithQuery(query);
      expect(screen.getByText('検索画面')).toBeInTheDocument();
    }
  );

  it('検索すると router.push でクエリを更新する', async () => {
    renderWithQuery('');
    await userEvent.click(screen.getByText('検索画面'));
    expect(push).toHaveBeenCalledWith('/?region=KR&q=Hide%20on%20bush%23KR1');
  });

  it('検索結果から別のサモナーを検索しても push する（戻るで前に戻れる）', async () => {
    renderWithQuery('region=KR&q=a%23KR1');
    await userEvent.click(screen.getByText('別の検索'));
    expect(push).toHaveBeenCalledWith('/?region=KR&q=Faker%23KR1');
  });

  it('空の検索（戻る）はクエリなしのトップページに戻す', async () => {
    renderWithQuery('region=KR&q=a%23KR1');
    await userEvent.click(screen.getByText('戻る'));
    expect(push).toHaveBeenCalledWith('/');
  });
});

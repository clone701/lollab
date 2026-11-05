import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UpdateButton from '@/components/summoner-search/UpdateButton';
import SummonerProfile from '@/components/summoner-search/SummonerProfile';
import { MOCK_SUMMONER } from '@/lib/summoner-search';

const THREE_DAYS_AGO = new Date(Date.now() - 3 * 86400 * 1000).toISOString();

describe('UpdateButton', () => {
  it('通常時は「更新」ボタンが有効で、最終更新の経過時間を表示する', () => {
    render(
      <UpdateButton
        lastUpdatedAt={THREE_DAYS_AGO}
        isUpdating={false}
        onUpdate={() => {}}
      />
    );
    expect(screen.getByRole('button', { name: '更新' })).toBeEnabled();
    expect(screen.getByText('最終更新: 3日前')).toBeInTheDocument();
  });

  it('更新中は disabled で「更新中...」を表示する', () => {
    render(
      <UpdateButton
        lastUpdatedAt={THREE_DAYS_AGO}
        isUpdating={true}
        onUpdate={() => {}}
      />
    );
    expect(screen.getByRole('button', { name: '更新中...' })).toBeDisabled();
  });

  it('クリックで onUpdate が呼ばれる', async () => {
    const onUpdate = jest.fn();
    render(
      <UpdateButton
        lastUpdatedAt={THREE_DAYS_AGO}
        isUpdating={false}
        onUpdate={onUpdate}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: '更新' }));
    expect(onUpdate).toHaveBeenCalledTimes(1);
  });
});

describe('SummonerProfile の更新エラー表示', () => {
  const baseProps = {
    summoner: MOCK_SUMMONER,
    rankPosition: null,
    isFavorite: false,
    onToggleFavorite: () => {},
    isLoggedIn: false,
    isUpdating: false,
    onUpdate: () => {},
  };

  it('updateError があれば alert として表示する', () => {
    render(<SummonerProfile {...baseProps} updateError="更新に失敗しました" />);
    expect(screen.getByRole('alert')).toHaveTextContent('更新に失敗しました');
  });

  it('updateError が null なら表示しない', () => {
    render(<SummonerProfile {...baseProps} updateError={null} />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

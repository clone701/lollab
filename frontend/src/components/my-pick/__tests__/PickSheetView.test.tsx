import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { deletePickSheet, getPickSheet } from '@/adapters/supabase';
import { PickSheetView } from '../view';
import { makeDetail } from '../__fixtures__/sheets';

jest.mock('@/adapters/supabase', () => ({
  getPickSheet: jest.fn(),
  deletePickSheet: jest.fn(),
}));

function setup() {
  const props = {
    sheetId: 1,
    onBack: jest.fn(),
    onEdit: jest.fn(),
    onDeleted: jest.fn(),
    onNotFound: jest.fn(),
    onToast: jest.fn(),
  };
  render(<PickSheetView {...props} />);
  return props;
}

describe('PickSheetView: 閲覧', () => {
  beforeEach(() => {
    jest.mocked(getPickSheet).mockResolvedValue(makeDetail());
    jest.mocked(deletePickSheet).mockReset();
    jest.mocked(deletePickSheet).mockResolvedValue();
  });

  it('ピックが入っている相手の行だけを、相手の名前とピックのアイコンで表示する', async () => {
    setup();
    await screen.findByText('TOP表');
    expect(screen.getByText('アーリ')).toBeInTheDocument();
    expect(screen.getByText('ゼド')).toBeInTheDocument();
    // ピックが空の相手は出さない
    expect(screen.queryByText('アカリ')).not.toBeInTheDocument();
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0);
  });

  it('ピックのアイコンを順番どおりに並べ、対策ノートへのリンクにする', async () => {
    setup();
    await screen.findByText('TOP表');
    const links = screen.getAllByRole('link');
    expect(links.map((l) => l.getAttribute('href'))).toEqual([
      '/notes?tab=matchup&my=Zed&enemy=Ahri',
      '/notes?tab=matchup&my=Yasuo&enemy=Ahri',
      '/notes?tab=matchup&my=Ahri&enemy=Zed',
    ]);
    expect(links[0]).toHaveAccessibleName('ゼド vs アーリ の対策ノートを開く');
  });

  it('相手チャンピオンを名前で検索できる', async () => {
    setup();
    await screen.findByText('TOP表');
    await userEvent.type(
      screen.getByLabelText('相手チャンピオンを検索'),
      'ぜど'
    );
    expect(screen.queryByText('アーリ')).not.toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(1);

    await userEvent.clear(screen.getByLabelText('相手チャンピオンを検索'));
    await userEvent.type(
      screen.getByLabelText('相手チャンピオンを検索'),
      'xxxx'
    );
    expect(
      screen.getByText('該当する相手チャンピオンがありません')
    ).toBeInTheDocument();
  });

  it('ピックが1つもない表は、編集を促すメッセージを出す', async () => {
    jest.mocked(getPickSheet).mockResolvedValue(makeDetail({ rows: [] }));
    setup();
    expect(
      await screen.findByText(/ピックが入力されていません/)
    ).toBeInTheDocument();
  });

  it('編集・一覧に戻るを呼べる', async () => {
    const { onEdit, onBack } = setup();
    await screen.findByText('TOP表');
    await userEvent.click(screen.getByRole('button', { name: '編集' }));
    await userEvent.click(screen.getByRole('button', { name: '一覧に戻る' }));
    expect(onEdit).toHaveBeenCalled();
    expect(onBack).toHaveBeenCalled();
  });

  it('削除は確認してから行う', async () => {
    const { onDeleted } = setup();
    await screen.findByText('TOP表');
    await userEvent.click(screen.getByRole('button', { name: '削除' }));
    expect(deletePickSheet).not.toHaveBeenCalled();

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('このマイピック表を削除しますか？');
    await userEvent.click(within(dialog).getByRole('button', { name: '削除' }));
    await waitFor(() => expect(onDeleted).toHaveBeenCalled());
    expect(deletePickSheet).toHaveBeenCalledWith(1);
  });

  it('確認でキャンセルすれば削除しない', async () => {
    const { onDeleted } = setup();
    await screen.findByText('TOP表');
    await userEvent.click(screen.getByRole('button', { name: '削除' }));
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'キャンセル',
      })
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(deletePickSheet).not.toHaveBeenCalled();
    expect(onDeleted).not.toHaveBeenCalled();
  });

  it('削除に失敗したらトーストで知らせ、一覧には戻らない', async () => {
    jest.mocked(deletePickSheet).mockRejectedValue(new Error('x'));
    const { onDeleted, onToast } = setup();
    await screen.findByText('TOP表');
    await userEvent.click(screen.getByRole('button', { name: '削除' }));
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: '削除' })
    );
    await waitFor(() =>
      expect(onToast).toHaveBeenCalledWith(
        expect.stringContaining('失敗'),
        'error'
      )
    );
    expect(onDeleted).not.toHaveBeenCalled();
  });

  it('表が見つからなければ onNotFound を呼ぶ', async () => {
    jest.mocked(getPickSheet).mockResolvedValue(null);
    const { onNotFound } = setup();
    await waitFor(() => expect(onNotFound).toHaveBeenCalled());
  });
});

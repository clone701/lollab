import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createPickSheet, getPickSheets } from '@/adapters/supabase';
import { PickSheetList } from '../list';
import { makeSheet } from '../__fixtures__/sheets';

jest.mock('@/adapters/supabase', () => ({
  getPickSheets: jest.fn(),
  createPickSheet: jest.fn(),
}));

const sheets = [
  makeSheet({ id: 1, name: 'TOP表', lane: 'TOP', entryCount: 12 }),
  makeSheet({ id: 2, name: 'MID表', lane: 'MIDDLE', entryCount: 3 }),
  makeSheet({ id: 3, name: 'TOPその2', lane: 'TOP', entryCount: 0 }),
];

function setup(onToast = jest.fn()) {
  const props = { onOpen: jest.fn(), onCreated: jest.fn(), onToast };
  render(<PickSheetList {...props} />);
  return props;
}

describe('PickSheetList: 一覧', () => {
  beforeEach(() => {
    jest.mocked(getPickSheets).mockResolvedValue(sheets);
    jest.mocked(createPickSheet).mockReset();
  });

  it('表の名前・レーン・入力済みの相手の数・更新日時を表示する', async () => {
    setup();
    const card = (await screen.findByText('TOP表')).closest('button')!;
    expect(within(card).getByText('TOP')).toBeInTheDocument();
    expect(within(card).getByText('12体入力済み')).toBeInTheDocument();
    expect(
      within(card).getByText(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/)
    ).toBeInTheDocument();
    const midCard = screen.getByText('MID表').closest('button')!;
    expect(within(midCard).getByText('MID')).toBeInTheDocument();
  });

  it('レーンで絞り込める', async () => {
    setup();
    await screen.findByText('MID表');
    await userEvent.click(screen.getByRole('button', { name: 'MID' }));
    expect(screen.getByText('MID表')).toBeInTheDocument();
    expect(screen.queryByText('TOP表')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'JUNGLE' }));
    expect(
      screen.getByText('該当するマイピック表がありません')
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '全て' }));
    expect(screen.getByText('TOP表')).toBeInTheDocument();
    expect(screen.getByText('MID表')).toBeInTheDocument();
  });

  it('表を押すと開く', async () => {
    const { onOpen } = setup();
    await userEvent.click(await screen.findByText('MID表'));
    expect(onOpen).toHaveBeenCalledWith(2);
  });

  it('表が1つもなければ「マイピック表がありません」と新規作成を出す', async () => {
    jest.mocked(getPickSheets).mockResolvedValue([]);
    setup();
    expect(
      await screen.findByText('マイピック表がありません')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '新規作成' })
    ).toBeInTheDocument();
  });

  it('読み込みに失敗したら、再試行で取り直せる', async () => {
    jest.mocked(getPickSheets).mockRejectedValueOnce(new Error('x'));
    setup();
    expect(
      await screen.findByText('読み込みに失敗しました')
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '再試行' }));
    expect(await screen.findByText('TOP表')).toBeInTheDocument();
  });
});

describe('CreatePickSheetDialog: 新規作成', () => {
  beforeEach(() => {
    jest.mocked(getPickSheets).mockResolvedValue(sheets);
    jest.mocked(createPickSheet).mockReset();
  });

  async function openDialog() {
    const props = setup();
    await userEvent.click(
      await screen.findByRole('button', { name: '新規作成' })
    );
    return { ...props, dialog: screen.getByRole('dialog') };
  }

  it('名前が空の間は作成できない', async () => {
    const { dialog } = await openDialog();
    expect(within(dialog).getByRole('button', { name: '作成' })).toBeDisabled();
  });

  it('空白だけの名前はエラーを出して作成できない', async () => {
    const { dialog } = await openDialog();
    await userEvent.type(within(dialog).getByLabelText('表の名前'), '   ');
    expect(within(dialog).getByRole('alert')).toHaveTextContent(
      '入力してください'
    );
    expect(within(dialog).getByRole('button', { name: '作成' })).toBeDisabled();
  });

  it('51文字の名前はエラーを出して作成できない', async () => {
    const { dialog } = await openDialog();
    await userEvent.type(
      within(dialog).getByLabelText('表の名前'),
      'あ'.repeat(51)
    );
    expect(within(dialog).getByRole('alert')).toHaveTextContent('50文字以内');
    expect(within(dialog).getByRole('button', { name: '作成' })).toBeDisabled();
  });

  it('名前とレーンを入力して作ると、作った表の id で onCreated を呼ぶ', async () => {
    jest.mocked(createPickSheet).mockResolvedValue(makeSheet({ id: 42 }));
    const { dialog, onCreated } = await openDialog();
    await userEvent.type(within(dialog).getByLabelText('表の名前'), ' JG表 ');
    await userEvent.selectOptions(
      within(dialog).getByLabelText('レーン'),
      'JUNGLE'
    );
    await userEvent.click(within(dialog).getByRole('button', { name: '作成' }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(42));
    expect(createPickSheet).toHaveBeenCalledWith(' JG表 ', 'JUNGLE');
  });

  it('作成に失敗したらトーストで知らせ、ダイアログは開いたまま', async () => {
    jest.mocked(createPickSheet).mockRejectedValue(new Error('x'));
    const { dialog, onCreated, onToast } = await openDialog();
    await userEvent.type(within(dialog).getByLabelText('表の名前'), '表');
    await userEvent.click(within(dialog).getByRole('button', { name: '作成' }));

    await waitFor(() =>
      expect(onToast).toHaveBeenCalledWith(
        'マイピック表の作成に失敗しました',
        'error'
      )
    );
    expect(onCreated).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('Esc キーとキャンセルで閉じる', async () => {
    await openDialog();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '新規作成' }));
    await userEvent.click(screen.getByRole('button', { name: 'キャンセル' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

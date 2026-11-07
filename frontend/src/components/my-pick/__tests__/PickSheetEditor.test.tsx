import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getPickSheet, savePickSheet } from '@/adapters/supabase';
import { champions } from '@/lib/data/champions';
import { PickSheetEditor } from '../edit';
import { makeDetail } from '../__fixtures__/sheets';

jest.mock('@/adapters/supabase', () => ({
  getPickSheet: jest.fn(),
  savePickSheet: jest.fn(),
}));

function setup() {
  const props = {
    sheetId: 1,
    onSaved: jest.fn(),
    onCancel: jest.fn(),
    onNotFound: jest.fn(),
    onDirtyChange: jest.fn(),
    onToast: jest.fn(),
  };
  render(<PickSheetEditor {...props} />);
  return props;
}

const slot = (enemy: string, n: number) =>
  new RegExp(`^${enemy}へのピック${n}(を選ぶ|:)`);
const addButton = (enemy: string) =>
  screen.getByRole('button', { name: `${enemy}のピックの枠を増やす` });

// 相手 enemy の n 番目の枠でチャンピオン pick を選ぶ
async function pickInto(enemy: string, n: number, pick: string) {
  await userEvent.click(screen.getByRole('button', { name: slot(enemy, n) }));
  const dialog = screen.getByRole('dialog');
  await userEvent.type(
    within(dialog).getByLabelText('チャンピオンを検索'),
    pick
  );
  await userEvent.click(within(dialog).getByRole('button', { name: pick }));
}

describe('PickSheetEditor: 編集', () => {
  beforeEach(() => {
    jest.mocked(getPickSheet).mockResolvedValue(makeDetail());
    jest.mocked(savePickSheet).mockReset();
    jest.mocked(savePickSheet).mockResolvedValue();
  });

  afterEach(() => jest.restoreAllMocks());

  it('全チャンピオンを相手の行として並べ、各行に枠を3つ出す', async () => {
    setup();
    await screen.findByDisplayValue('TOP表');
    expect(
      screen.getAllByRole('button', { name: /のピックの枠を増やす$/ })
    ).toHaveLength(champions.length);

    // ピックが2つある Ahri も、空の Akali も枠は3つ
    for (const enemy of ['アーリ', 'アカリ']) {
      expect(
        screen.getByRole('button', { name: slot(enemy, 3) })
      ).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: slot(enemy, 4) })).toBeNull();
    }
  });

  it('保存済みのピックを順番どおりに枠へ入れる', async () => {
    setup();
    await screen.findByDisplayValue('TOP表');
    expect(
      screen.getByRole('button', { name: 'アーリへのピック1: ゼド（変更）' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'アーリへのピック2: ヤスオ（変更）' })
    ).toBeInTheDocument();
  });

  it('「＋」で枠が1つ増え、10になったら押せない', async () => {
    setup();
    await screen.findByDisplayValue('TOP表');
    for (let n = 4; n <= 10; n++) {
      expect(addButton('アカリ')).toBeEnabled();
      await userEvent.click(addButton('アカリ'));
      expect(
        screen.getByRole('button', { name: slot('アカリ', n) })
      ).toBeInTheDocument();
    }
    expect(addButton('アカリ')).toBeDisabled();
    expect(
      screen.queryByRole('button', { name: slot('アカリ', 11) })
    ).toBeNull();
    // 他の行は増えない
    expect(
      screen.queryByRole('button', { name: slot('アクシャン', 4) })
    ).toBeNull();
  });

  it('枠を押してチャンピオンを選ぶと、枠に入る', async () => {
    setup();
    await screen.findByDisplayValue('TOP表');
    await pickInto('アカリ', 1, 'ヨネ');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'アカリへのピック1: ヨネ（変更）' })
    ).toBeInTheDocument();
  });

  it('同じ行に同じチャンピオンは選べない（別の行なら選べる）', async () => {
    setup();
    await screen.findByDisplayValue('TOP表');
    await userEvent.click(
      screen.getByRole('button', { name: slot('アーリ', 3) })
    );
    // Ahri の行は Zed・Yasuo が既にある
    expect(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'ゼド' })
    ).toBeDisabled();
    expect(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'ヤスオ' })
    ).toBeDisabled();
    expect(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'ヨネ' })
    ).toBeEnabled();
    await userEvent.keyboard('{Escape}');

    await userEvent.click(
      screen.getByRole('button', { name: slot('アカリ', 1) })
    );
    expect(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'ゼド' })
    ).toBeEnabled();
  });

  it('相手と同じチャンピオン（ミラー）も選べる', async () => {
    setup();
    await screen.findByDisplayValue('TOP表');
    await pickInto('アカリ', 1, 'アカリ');
    expect(
      screen.getByRole('button', { name: 'アカリへのピック1: アカリ（変更）' })
    ).toBeInTheDocument();
  });

  it('Esc キーでチャンピオン選択を閉じる', async () => {
    setup();
    await screen.findByDisplayValue('TOP表');
    await userEvent.click(
      screen.getByRole('button', { name: slot('アカリ', 1) })
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('枠の「×」で外すと、右のピックが左に詰まる', async () => {
    setup();
    await screen.findByDisplayValue('TOP表');
    await userEvent.click(screen.getByRole('button', { name: 'ゼドを外す' }));
    expect(
      screen.getByRole('button', { name: 'アーリへのピック1: ヤスオ（変更）' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: slot('アーリ', 2) })
    ).toHaveAccessibleName('アーリへのピック2を選ぶ');
  });

  it('相手チャンピオンを日本語名・読み・英語名で検索できる', async () => {
    setup();
    await screen.findByDisplayValue('TOP表');
    const search = screen.getByLabelText('相手チャンピオンを検索');
    for (const q of ['アーリ', 'あーり', 'ahri']) {
      await userEvent.clear(search);
      await userEvent.type(search, q);
      expect(
        screen.getAllByRole('button', { name: /のピックの枠を増やす$/ })
      ).toHaveLength(1);
      expect(addButton('アーリ')).toBeInTheDocument();
    }
  });

  it('「入力済みの行だけ表示」で、ピックのある行だけにする', async () => {
    setup();
    await screen.findByDisplayValue('TOP表');
    await userEvent.click(screen.getByLabelText('入力済みの行だけ表示'));
    expect(
      screen.getAllByRole('button', { name: /のピックの枠を増やす$/ })
    ).toHaveLength(2);
    expect(addButton('アーリ')).toBeInTheDocument();
    expect(addButton('ゼド')).toBeInTheDocument();
  });
});

describe('PickSheetEditor: 保存・未保存の確認', () => {
  beforeEach(() => {
    jest.mocked(getPickSheet).mockResolvedValue(makeDetail());
    jest.mocked(savePickSheet).mockReset();
    jest.mocked(savePickSheet).mockResolvedValue();
  });

  afterEach(() => jest.restoreAllMocks());

  it('保存すると、名前・レーン・ピックを渡して onSaved を呼ぶ', async () => {
    const { onSaved } = setup();
    const name = await screen.findByDisplayValue('TOP表');
    await userEvent.clear(name);
    await userEvent.type(name, ' 新しい表 ');
    await userEvent.selectOptions(screen.getByLabelText('レーン'), 'MIDDLE');
    await pickInto('アカリ', 1, 'ヨネ');
    await userEvent.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(savePickSheet).toHaveBeenCalledWith(1, ' 新しい表 ', 'MIDDLE', [
      { enemyChampionId: 'Ahri', pickChampionIds: ['Zed', 'Yasuo'] },
      { enemyChampionId: 'Akali', pickChampionIds: ['Yone'] },
      { enemyChampionId: 'Zed', pickChampionIds: ['Ahri'] },
    ]);
  });

  it('空にした行は保存しない', async () => {
    const { onSaved } = setup();
    await screen.findByDisplayValue('TOP表');
    await userEvent.click(screen.getByRole('button', { name: 'アーリを外す' }));
    await userEvent.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(jest.mocked(savePickSheet).mock.calls[0][3]).toEqual([
      { enemyChampionId: 'Ahri', pickChampionIds: ['Zed', 'Yasuo'] },
    ]);
  });

  it('保存に失敗したらトーストを出し、編集内容を残して再保存できる', async () => {
    jest.mocked(savePickSheet).mockRejectedValueOnce(new Error('x'));
    const { onSaved, onToast } = setup();
    await screen.findByDisplayValue('TOP表');
    await pickInto('アカリ', 1, 'ヨネ');
    await userEvent.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() =>
      expect(onToast).toHaveBeenCalledWith(
        expect.stringContaining('失敗'),
        'error'
      )
    );
    expect(onSaved).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'アカリへのピック1: ヨネ（変更）' })
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByRole('button', { name: '保存' })).toBeEnabled()
    );
    await userEvent.click(screen.getByRole('button', { name: '保存' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });

  it('名前が空ならエラーを出して保存できない', async () => {
    setup();
    const name = await screen.findByDisplayValue('TOP表');
    await userEvent.clear(name);
    expect(screen.getByRole('alert')).toHaveTextContent('入力してください');
    expect(screen.getByRole('button', { name: '保存' })).toBeDisabled();
  });

  it('変更がなければ、キャンセルは確認せずに閉じる', async () => {
    const confirm = jest.spyOn(window, 'confirm');
    const { onCancel, onDirtyChange } = setup();
    await screen.findByDisplayValue('TOP表');
    await userEvent.click(screen.getByRole('button', { name: 'キャンセル' }));
    expect(confirm).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalled();
    expect(onDirtyChange).not.toHaveBeenCalledWith(true);
  });

  it('未保存の変更があれば、キャンセルで確認する（破棄しないなら閉じない）', async () => {
    const confirm = jest.spyOn(window, 'confirm').mockReturnValue(false);
    const { onCancel, onDirtyChange } = setup();
    await screen.findByDisplayValue('TOP表');
    await pickInto('アカリ', 1, 'ヨネ');
    expect(onDirtyChange).toHaveBeenLastCalledWith(true);

    await userEvent.click(screen.getByRole('button', { name: 'キャンセル' }));
    expect(confirm).toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();

    confirm.mockReturnValue(true);
    await userEvent.click(screen.getByRole('button', { name: 'キャンセル' }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('変更を元に戻せば、未保存ではなくなる', async () => {
    const { onDirtyChange } = setup();
    await screen.findByDisplayValue('TOP表');
    await pickInto('アカリ', 1, 'ヨネ');
    expect(onDirtyChange).toHaveBeenLastCalledWith(true);
    await userEvent.click(screen.getByRole('button', { name: 'ヨネを外す' }));
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
  });

  it('未保存の間だけ、ページを離れる前の確認（beforeunload）を出す', async () => {
    setup();
    await screen.findByDisplayValue('TOP表');
    const clean = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(clean);
    expect(clean.defaultPrevented).toBe(false);

    await pickInto('アカリ', 1, 'ヨネ');
    const dirty = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(dirty);
    expect(dirty.defaultPrevented).toBe(true);
  });

  it('名前を変えるだけでも未保存になる', async () => {
    const { onDirtyChange } = setup();
    const name = await screen.findByDisplayValue('TOP表');
    fireEvent.change(name, { target: { value: 'TOP表2' } });
    expect(onDirtyChange).toHaveBeenLastCalledWith(true);
  });
});

describe('PickSheetEditor: 読み込み', () => {
  it('表が見つからなければ onNotFound を呼ぶ', async () => {
    jest.mocked(getPickSheet).mockResolvedValue(null);
    const { onNotFound } = setup();
    await waitFor(() => expect(onNotFound).toHaveBeenCalled());
  });

  it('読み込みに失敗したら、再試行ボタンを出す', async () => {
    jest.mocked(getPickSheet).mockRejectedValueOnce(new Error('x'));
    jest.mocked(getPickSheet).mockResolvedValueOnce(makeDetail());
    setup();
    await userEvent.click(
      await screen.findByRole('button', { name: '再試行' })
    );
    expect(await screen.findByDisplayValue('TOP表')).toBeInTheDocument();
  });
});

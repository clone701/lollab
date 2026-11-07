/**
 * マイピックタブ - 作成から閲覧・削除までの流れ
 *
 * 一覧 → 新規作成 → 編集 → 保存 → 閲覧（対策ノートへのリンク）→ 削除 → 一覧
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createPickSheet,
  deletePickSheet,
  getPickSheet,
  getPickSheets,
  savePickSheet,
} from '@/adapters/supabase';
import { MyPickTabContent } from '..';
import { makeDetail, makeSheet } from '../__fixtures__/sheets';

jest.mock('@/adapters/supabase', () => ({
  getPickSheets: jest.fn(),
  getPickSheet: jest.fn(),
  createPickSheet: jest.fn(),
  savePickSheet: jest.fn(),
  deletePickSheet: jest.fn(),
}));

describe('MyPickTabContent: 作成から削除まで', () => {
  afterEach(() => jest.restoreAllMocks());

  it('表を作って、ピックを入れて保存し、閲覧から対策ノートへのリンクを確認して削除できる', async () => {
    const saved = makeDetail({
      id: 7,
      name: 'MID表',
      lane: 'MIDDLE',
      rows: [{ enemyChampionId: 'Ahri', pickChampionIds: ['Zed'] }],
    });
    jest.mocked(getPickSheets).mockResolvedValue([]);
    jest.mocked(createPickSheet).mockResolvedValue(makeSheet({ id: 7 }));
    jest
      .mocked(getPickSheet)
      .mockResolvedValue(makeDetail({ id: 7, rows: [] }));
    jest.mocked(savePickSheet).mockResolvedValue();
    jest.mocked(deletePickSheet).mockResolvedValue();
    const onDirtyChange = jest.fn();
    render(<MyPickTabContent onDirtyChange={onDirtyChange} />);

    // 一覧（空）→ 新規作成
    await userEvent.click(
      await screen.findByRole('button', { name: '新規作成' })
    );
    const dialog = screen.getByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText('表の名前'), 'MID表');
    await userEvent.click(within(dialog).getByRole('button', { name: '作成' }));

    // 編集: アーリの1枠目にゼドを入れて保存
    await screen.findByLabelText('相手チャンピオンを検索');
    await userEvent.click(
      screen.getByRole('button', { name: 'アーリへのピック1を選ぶ' })
    );
    const picker = screen.getByRole('dialog');
    await userEvent.type(
      within(picker).getByLabelText('チャンピオンを検索'),
      'ゼド'
    );
    await userEvent.click(within(picker).getByRole('button', { name: 'ゼド' }));
    jest.mocked(getPickSheet).mockResolvedValue(saved);
    await userEvent.click(screen.getByRole('button', { name: '保存' }));

    // 閲覧: 保存した内容と、対策ノートへのリンク
    const link = await screen.findByRole('link', {
      name: 'ゼド vs アーリ の対策ノートを開く',
    });
    expect(link).toHaveAttribute(
      'href',
      '/notes?tab=matchup&my=Zed&enemy=Ahri'
    );
    expect(savePickSheet).toHaveBeenCalledWith(7, 'TOP表', 'TOP', [
      { enemyChampionId: 'Ahri', pickChampionIds: ['Zed'] },
    ]);
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
    expect(
      await screen.findByText('マイピック表を保存しました')
    ).toBeInTheDocument();

    // 削除 → 一覧に戻る
    jest.mocked(getPickSheets).mockResolvedValue([]);
    await userEvent.click(screen.getByRole('button', { name: '削除' }));
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: '削除' })
    );
    await waitFor(() => expect(deletePickSheet).toHaveBeenCalledWith(7));
    expect(
      await screen.findByText('マイピック表がありません')
    ).toBeInTheDocument();
  });

  it('開いた表が見つからなければ、一覧に戻ってトーストで知らせる', async () => {
    jest.mocked(getPickSheets).mockResolvedValue([makeSheet({ id: 3 })]);
    jest.mocked(getPickSheet).mockResolvedValue(null);
    render(<MyPickTabContent onDirtyChange={jest.fn()} />);

    await userEvent.click(await screen.findByText('TOP表'));

    expect(
      await screen.findByText('マイピック表が見つかりませんでした')
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: '新規作成' })
    ).toBeInTheDocument();
  });
});

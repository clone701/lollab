import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GeneralNoteForm } from '../GeneralNoteForm';

const mockOnSave = jest.fn();
const mockOnCancel = jest.fn();

function renderForm() {
  return render(
    <GeneralNoteForm
      mode="create"
      onSave={mockOnSave}
      onCancel={mockOnCancel}
    />
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GeneralNoteForm', () => {
  // 1. バリデーション: タイトルが空の場合、保存ボタンクリックでエラーメッセージが表示される
  it('タイトルが空の場合、保存ボタンクリックでエラーメッセージが表示される', async () => {
    renderForm();
    await userEvent.click(screen.getByRole('button', { name: '保存' }));
    expect(
      await screen.findByText('タイトルを入力してください')
    ).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  // 2. 保存成功: 有効なデータでonSaveが呼ばれる
  it('有効なデータで保存ボタンをクリックするとonSaveが呼ばれる', async () => {
    mockOnSave.mockResolvedValueOnce(undefined);
    renderForm();
    await userEvent.type(
      screen.getByPlaceholderText('タイトル'),
      'テストタイトル'
    );
    await userEvent.click(screen.getByRole('button', { name: '保存' }));
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        title: 'テストタイトル',
        body: '',
        tags: [],
      });
    });
  });

  // 3. 保存失敗: onSaveがエラーをthrowした場合、エラーが適切に処理される
  it('onSaveがエラーをthrowした場合、エラーメッセージが表示される', async () => {
    mockOnSave.mockRejectedValueOnce(new Error('保存エラー'));
    renderForm();
    await userEvent.type(
      screen.getByPlaceholderText('タイトル'),
      'テストタイトル'
    );
    await userEvent.click(screen.getByRole('button', { name: '保存' }));
    expect(await screen.findByText('保存に失敗しました')).toBeInTheDocument();
  });
});

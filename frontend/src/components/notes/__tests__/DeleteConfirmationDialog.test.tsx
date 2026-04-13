import { render, screen, fireEvent } from '@testing-library/react';
import DeleteConfirmationDialog from '../DeleteConfirmationDialog';

describe('DeleteConfirmationDialog', () => {
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ダイアログが閉じている場合は何も表示しない', () => {
    const { container } = render(
      <DeleteConfirmationDialog
        isOpen={false}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('ダイアログが開いている場合はメッセージを表示する', () => {
    render(
      <DeleteConfirmationDialog
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    expect(screen.getByText('このノートを削除しますか？')).toBeInTheDocument();
    expect(screen.getByText('この操作は取り消せません')).toBeInTheDocument();
  });

  it('キャンセルボタンをクリックするとonCancelが呼ばれる', () => {
    render(
      <DeleteConfirmationDialog
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    const cancelButton = screen.getByText('キャンセル');
    fireEvent.click(cancelButton);
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('削除ボタンをクリックするとonConfirmが呼ばれる', () => {
    render(
      <DeleteConfirmationDialog
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    const deleteButton = screen.getByText('削除');
    fireEvent.click(deleteButton);
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  it('オーバーレイをクリックするとonCancelが呼ばれる', () => {
    render(
      <DeleteConfirmationDialog
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    const overlay = screen.getByRole('dialog').previousSibling as HTMLElement;
    fireEvent.click(overlay);
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });
});

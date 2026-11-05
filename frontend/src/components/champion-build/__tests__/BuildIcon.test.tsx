import { fireEvent, render, screen } from '@testing-library/react';
import { BuildIcon } from '../BuildIcon';

describe('BuildIcon', () => {
  it('src を表示し、読み込みに失敗したら fallbackSrc に切り替える', () => {
    render(
      <BuildIcon
        src="/a.png"
        fallbackSrc="https://example.com/a.png"
        label="X"
      />
    );
    expect(screen.getByAltText('X')).toHaveAttribute(
      'src',
      expect.stringMatching(/\/a\.png$/)
    );
    fireEvent.error(screen.getByAltText('X'));
    expect(screen.getByAltText('X')).toHaveAttribute(
      'src',
      'https://example.com/a.png'
    );
  });

  it('すべて失敗したら画像の代わりにラベル付きの枠を出す', () => {
    render(<BuildIcon src="/a.png" label="X" />);
    fireEvent.error(screen.getByAltText('X'));
    expect(screen.getByRole('img', { name: 'X' })).toHaveTextContent('?');
  });

  it('src が null ならはじめから枠を出す', () => {
    render(<BuildIcon src={null} label="未知" />);
    expect(screen.getByRole('img', { name: '未知' })).toBeInTheDocument();
  });
});

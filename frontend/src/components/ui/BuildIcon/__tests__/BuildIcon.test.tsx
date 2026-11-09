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

  it('title は既定で付き、showTitle={false} なら画像にも枠にも付かない', () => {
    const { rerender } = render(<BuildIcon src="/a.png" label="X" />);
    expect(screen.getByAltText('X')).toHaveAttribute('title', 'X');
    rerender(<BuildIcon src="/a.png" label="X" showTitle={false} />);
    expect(screen.getByAltText('X')).not.toHaveAttribute('title');
    rerender(<BuildIcon src={null} label="X" showTitle={false} />);
    expect(screen.getByRole('img', { name: 'X' })).not.toHaveAttribute('title');
  });

  it('src が null ならはじめから枠を出す', () => {
    render(<BuildIcon src={null} label="未知" />);
    expect(screen.getByRole('img', { name: '未知' })).toBeInTheDocument();
  });
});

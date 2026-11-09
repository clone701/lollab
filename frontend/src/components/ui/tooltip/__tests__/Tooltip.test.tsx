import { act, fireEvent, render, screen } from '@testing-library/react';
import { Tooltip } from '..';

function renderTooltip(): HTMLElement {
  render(<Tooltip trigger={<span>アイコン</span>} content={<p>説明</p>} />);
  return screen.getByText('アイコン').parentElement as HTMLElement;
}

describe('Tooltip', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('マウスを乗せて 100ms 後に開く', () => {
    const trigger = renderTooltip();
    fireEvent.mouseEnter(trigger);
    act(() => jest.advanceTimersByTime(99));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    act(() => jest.advanceTimersByTime(1));
    expect(screen.getByRole('tooltip')).toHaveTextContent('説明');
  });

  it('100ms 前にマウスが離れると開かない', () => {
    const trigger = renderTooltip();
    fireEvent.mouseEnter(trigger);
    act(() => jest.advanceTimersByTime(50));
    fireEvent.mouseLeave(trigger);
    act(() => jest.advanceTimersByTime(200));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('フォーカスで即時に開く', () => {
    fireEvent.focus(renderTooltip());
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('マウスが離れると閉じる', () => {
    const trigger = renderTooltip();
    fireEvent.focus(trigger);
    fireEvent.mouseLeave(trigger);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('フォーカスが外れると閉じる', () => {
    const trigger = renderTooltip();
    fireEvent.focus(trigger);
    fireEvent.blur(trigger);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('Esc で閉じる', () => {
    fireEvent.focus(renderTooltip());
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('role="tooltip" の id をトリガーの aria-describedby が指す', () => {
    const trigger = renderTooltip();
    expect(trigger).not.toHaveAttribute('aria-describedby');
    fireEvent.focus(trigger);
    const id = screen.getByRole('tooltip').id;
    expect(id).not.toBe('');
    expect(trigger).toHaveAttribute('aria-describedby', id);
  });

  it('トリガーを tabIndex=0 の要素で包み、パネルは body 直下に出す', () => {
    const trigger = renderTooltip();
    expect(trigger).toHaveAttribute('tabindex', '0');
    fireEvent.focus(trigger);
    expect(screen.getByRole('tooltip').parentElement).toBe(document.body);
    expect(screen.getByRole('tooltip')).toHaveClass('fixed');
  });
});

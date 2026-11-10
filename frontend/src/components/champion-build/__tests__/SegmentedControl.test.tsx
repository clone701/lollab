import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SegmentedControl } from '../SegmentedControl';

const OPTIONS = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' },
];

describe('SegmentedControl', () => {
  it('radiogroup の中に radio が並び、選択中だけ aria-checked が true', () => {
    render(
      <SegmentedControl
        label="種類"
        value="b"
        options={OPTIONS}
        onChange={jest.fn()}
      />
    );
    expect(screen.getByRole('radiogroup', { name: '種類' })).toBeVisible();
    expect(screen.getByRole('radio', { name: 'A' })).toHaveAttribute(
      'aria-checked',
      'false'
    );
    const selected = screen.getByRole('radio', { name: 'B' });
    expect(selected).toHaveAttribute('aria-checked', 'true');
    expect(selected).toHaveClass('ring-accent', 'bg-accent/15');
  });

  it('押したボタンの値で onChange を呼ぶ', async () => {
    const onChange = jest.fn();
    render(
      <SegmentedControl
        label="種類"
        value="a"
        options={OPTIONS}
        onChange={onChange}
      />
    );
    await userEvent.click(screen.getByRole('radio', { name: 'B' }));
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('showLabel のときは見えるラベルをグループの名前にする', () => {
    render(
      <SegmentedControl
        label="種類"
        showLabel
        value="a"
        options={OPTIONS}
        onChange={jest.fn()}
      />
    );
    expect(screen.getByText('種類')).toBeVisible();
    expect(screen.getByRole('radiogroup', { name: '種類' })).toBeVisible();
  });
});

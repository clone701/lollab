import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getRuneIcon } from '@/lib/champion-build';
import { element, option } from '../__fixtures__/buildResponse';
import { RunePanel } from '../RunePanel';

const FIRST = [
  8100, 8112, 8126, 8138, 8135, 8200, 8226, 8210, 5008, 5008, 5001,
];
const SECOND = [
  8000, 8005, 9111, 9104, 8014, 8200, 8226, 8210, 5005, 5008, 5001,
];
const FIRST_KEYSTONE = getRuneIcon(8112)!.name;
const SECOND_KEYSTONE = getRuneIcon(8005)!.name;

// 75%・25%になる2件
const TWO = element([option(FIRST, 45, 27), option(SECOND, 15, 6)]);

describe('RunePanel', () => {
  it('初期表示は1番目で、ボタンに採用率を出す', () => {
    render(<RunePanel runes={TWO} />);
    const first = screen.getByRole('radio', { name: '1番目 ・ 採用率75%' });
    const second = screen.getByRole('radio', { name: '2番目 ・ 採用率25%' });
    expect(first).toHaveAttribute('aria-checked', 'true');
    expect(second).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByAltText(FIRST_KEYSTONE)).toBeInTheDocument();
    expect(screen.queryByAltText(SECOND_KEYSTONE)).not.toBeInTheDocument();
  });

  it('2番目を押すと2番目の内容と勝率に変わり、1番目を押すと戻る', async () => {
    render(<RunePanel runes={TWO} />);
    await userEvent.click(screen.getByRole('radio', { name: /2番目/ }));
    expect(screen.getByRole('radio', { name: /2番目/ })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    expect(screen.getByAltText(SECOND_KEYSTONE)).toBeInTheDocument();
    expect(screen.queryByAltText(FIRST_KEYSTONE)).not.toBeInTheDocument();
    expect(screen.getByText('勝率 40.0%')).toBeInTheDocument(); // 6 / 15

    await userEvent.click(screen.getByRole('radio', { name: /1番目/ }));
    expect(screen.getByAltText(FIRST_KEYSTONE)).toBeInTheDocument();
    expect(screen.getByText('勝率 60.0%')).toBeInTheDocument(); // 27 / 45
  });

  it('呼び出し側の key が変わると1番目に戻る', async () => {
    const { rerender } = render(<RunePanel key="MIDDLE" runes={TWO} />);
    await userEvent.click(screen.getByRole('radio', { name: /2番目/ }));
    rerender(<RunePanel key="BOTTOM" runes={TWO} />);
    expect(screen.getByRole('radio', { name: /1番目/ })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    expect(screen.getByAltText(FIRST_KEYSTONE)).toBeInTheDocument();
  });

  it('2件目が無ければボタンを出さず、1番目の内容だけを出す', () => {
    render(<RunePanel runes={element([option(FIRST, 45, 27)])} />);
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    expect(screen.getByAltText(FIRST_KEYSTONE)).toBeInTheDocument();
  });

  it('選択肢がなければ「データなし」でボタンも出さない', () => {
    render(<RunePanel runes={{ games: 0, options: [] }} />);
    expect(screen.getByText('データなし')).toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });
});

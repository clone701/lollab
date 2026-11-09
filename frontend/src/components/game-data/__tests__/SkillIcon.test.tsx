import { fireEvent, render, screen, within } from '@testing-library/react';
import urgotFixture from '@/lib/game-data/__fixtures__/urgot.json';
import { toChampionSkills } from '@/lib/game-data';
import type { SkillInfo } from '@/lib/game-data';
import { SkillIcon } from '..';

const [passive, q] = toChampionSkills(urgotFixture);

function openTooltip(skill: SkillInfo): HTMLElement {
  fireEvent.focus(
    screen.getByAltText(skill.name).parentElement?.parentElement as HTMLElement
  );
  return screen.getByRole('tooltip');
}

describe('SkillIcon', () => {
  it('スキル画像と右下の Q を出す', () => {
    render(<SkillIcon skill={q} fallbackKey="Q" />);
    expect(screen.getByAltText('コラプトシェル')).toHaveAttribute(
      'src',
      expect.stringContaining('UrgotQ.png')
    );
    expect(screen.getByText('Q')).toBeInTheDocument();
  });

  it('画像が読み込めないときは文字の Q だけを出す', () => {
    render(<SkillIcon skill={q} fallbackKey="Q" />);
    fireEvent.error(screen.getByAltText('コラプトシェル'));
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('Q')).toBeInTheDocument();
  });

  it('データが無いときは文字の Q だけを出し、ツールチップは付かない', () => {
    const { container } = render(<SkillIcon skill={null} fallbackKey="Q" />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('Q')).toBeInTheDocument();
    expect(container.querySelector('[tabindex]')).toBeNull();
  });

  it('ツールチップに [Q]・名前・クールダウン・コスト・説明が出る', () => {
    render(<SkillIcon skill={q} fallbackKey="Q" />);
    const tooltip = openTooltip(q);
    expect(within(tooltip).getByText('[Q] コラプトシェル')).toBeInTheDocument();
    expect(within(tooltip).getByText('10/9.5/9/8.5/8 秒')).toBeInTheDocument();
    expect(within(tooltip).getByText('70 マナ')).toBeInTheDocument();
    expect(tooltip).toHaveTextContent('榴弾を発射する');
  });

  it('コストが無いスキルにはコストの行が無い', () => {
    const noCost: SkillInfo = { ...q, costBurn: '0' };
    render(<SkillIcon skill={noCost} fallbackKey="Q" />);
    const tooltip = openTooltip(noCost);
    expect(tooltip).not.toHaveTextContent('マナ');
  });

  it('パッシブはクールダウンもコストも出さない', () => {
    render(<SkillIcon skill={passive} fallbackKey="P" />);
    const tooltip = openTooltip(passive);
    expect(tooltip).toHaveTextContent('[P] エコーフレイム');
    expect(tooltip).not.toHaveTextContent('秒');
    expect(tooltip).not.toHaveTextContent('マナ');
  });

  it('detail があれば説明にそれを出す（概要は出さない）', () => {
    const withDetail: SkillInfo = {
      ...q,
      detail:
        '<physicalDamage>25/70 のダメージ</physicalDamage>を与え、1.25秒間',
    };
    render(<SkillIcon skill={withDetail} fallbackKey="Q" />);
    const tooltip = openTooltip(withDetail);
    expect(tooltip).toHaveTextContent('25/70 のダメージを与え、1.25秒間');
    expect(tooltip).not.toHaveTextContent('榴弾を発射する');
  });

  it('detail の数値が数値の色になる', () => {
    const withDetail: SkillInfo = { ...q, detail: '1.25秒間スロウする' };
    render(<SkillIcon skill={withDetail} fallbackKey="Q" />);
    const tooltip = openTooltip(withDetail);
    expect(within(tooltip).getByText('1.25秒')).toHaveClass('text-game-number');
  });
});

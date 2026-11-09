import { render, screen, within } from '@testing-library/react';
import monkeyKingFixture from '@/lib/game-data/__fixtures__/monkeyKing.json';
import urgotFixture from '@/lib/game-data/__fixtures__/urgot.json';
import { toChampionSkills } from '@/lib/game-data';
import { SkillLevelList } from '../build/SkillLevelList';

const SKILL_ORDER = [1, 2, 3, 1, 1, 4];

describe('SkillLevelList', () => {
  it('skills が null なら今の文字の表示で、R は強調する', () => {
    render(<SkillLevelList skillOrder={SKILL_ORDER} skills={null} />);
    const levels = screen.getAllByLabelText(/^レベル\d+: /);
    expect(levels.map((l) => l.textContent).join('')).toBe('QWEQQR');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByLabelText('レベル6: R')).toHaveClass('ring-highlight');
  });

  it('マスがスキル画像になり、aria-label と R の強調は残る', () => {
    render(
      <SkillLevelList
        skillOrder={SKILL_ORDER}
        skills={toChampionSkills(urgotFixture)}
      />
    );
    const q = screen.getByLabelText('レベル1: Q');
    expect(within(q).getByAltText('コラプトシェル')).toBeInTheDocument();
    expect(q).toHaveTextContent('Q');
    expect(q).not.toHaveClass('ring-highlight');
    const r = screen.getByLabelText('レベル6: R');
    expect(within(r).getByAltText('デスグラインダー')).toBeInTheDocument();
    expect(r).toHaveClass('text-highlight', 'font-bold', 'ring-highlight');
    expect(screen.getAllByRole('img')).toHaveLength(SKILL_ORDER.length);
  });

  it('ウーコンのスキルでも画像が出る', () => {
    render(
      <SkillLevelList
        skillOrder={SKILL_ORDER}
        skills={toChampionSkills(monkeyKingFixture)}
      />
    );
    expect(
      within(screen.getByLabelText('レベル2: W')).getByAltText('戦士の幻惑')
    ).toHaveAttribute('src', expect.stringContaining('MonkeyKingDecoy.png'));
  });

  it('範囲外の番号は「?」を出す', () => {
    render(<SkillLevelList skillOrder={[9]} skills={null} />);
    expect(screen.getByLabelText('レベル1: ?')).toHaveTextContent('?');
  });
});

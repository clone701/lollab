import { render, screen, within } from '@testing-library/react';
import urgotFixture from '@/lib/game-data/__fixtures__/urgot.json';
import { toChampionSkills } from '@/lib/game-data';
import { SkillOrderGrid } from '../SkillOrderGrid';

const SKILL_KEY = [1, 2, 3, 1, 1, 4, 1, 2, 1, 2, 4, 2, 2, 3, 3];
const SKILL_NAMES = [
  'コラプトシェル',
  'パージ',
  'ディスデイン',
  'デスグラインダー',
];

function rowHeaders(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('tbody th'));
}

describe('SkillOrderGrid', () => {
  it('skills が null なら行の見出しは今の文字で、画像は出ない', () => {
    const { container } = render(
      <SkillOrderGrid skillKey={SKILL_KEY} skills={null} />
    );
    expect(rowHeaders(container).map((th) => th.textContent)).toEqual([
      'Q',
      'W',
      'E',
      'R',
    ]);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('skills があれば行の見出しがスキル画像になり、右下に Q/W/E/R が残る', () => {
    const { container } = render(
      <SkillOrderGrid
        skillKey={SKILL_KEY}
        skills={toChampionSkills(urgotFixture)}
      />
    );
    const headers = rowHeaders(container);
    expect(headers).toHaveLength(4);
    headers.forEach((header, row) => {
      expect(within(header).getByAltText(SKILL_NAMES[row])).toBeInTheDocument();
      expect(header).toHaveTextContent('QWER'[row]);
    });
  });

  it('塗ったマスの文字と aria-label は skills の有無で変わらない', () => {
    const { rerender } = render(
      <SkillOrderGrid skillKey={SKILL_KEY} skills={null} />
    );
    expect(screen.getByLabelText('レベル6: R')).toHaveTextContent('R');
    rerender(
      <SkillOrderGrid
        skillKey={SKILL_KEY}
        skills={toChampionSkills(urgotFixture)}
      />
    );
    const cell = screen.getByLabelText('レベル6: R');
    expect(cell).toHaveTextContent('R');
    expect(cell).toHaveClass('bg-action');
    expect(screen.queryByLabelText('レベル1: E')).not.toBeInTheDocument();
  });
});

import { render, screen, within } from '@testing-library/react';
import { toChampionSkills } from '@/lib/game-data';
import type { SkillInfo } from '@/lib/game-data';
import urgotFixture from '@/lib/game-data/__fixtures__/urgot.json';
import { element, option } from '../__fixtures__/buildResponse';
import { SkillPanel } from '../SkillPanel';

const SKILL_ORDER = [1, 2, 3, 1, 1, 4, 1, 2, 1, 2, 4, 2, 2, 3, 3];

function renderPanel(skills: SkillInfo[] | null): void {
  render(
    <SkillPanel
      skills={skills}
      skillPriority={element([option([1, 2, 3], 80, 40)])}
      skillOrder={element([option(SKILL_ORDER, 50, 25)])}
    />
  );
}

describe('SkillPanel', () => {
  it('スキルが無い（読み込み前・失敗）ときは今の文字の表示で、画像とパッシブは出ない', () => {
    renderPanel(null);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByText('パッシブ')).not.toBeInTheDocument();
    const priority = screen.getByRole('group', { name: 'Q > W > E' });
    expect(priority).toHaveTextContent('Q>W>E');
    expect(screen.getByLabelText('レベル1: Q')).toHaveTextContent('Q');
    expect(screen.getByLabelText('レベル6: R')).toBeInTheDocument();
  });

  it('スキルがあれば優先順がスキル画像の並びになる', () => {
    renderPanel(toChampionSkills(urgotFixture));
    const priority = within(screen.getByRole('group', { name: 'Q > W > E' }));
    expect(
      priority.getAllByRole('img').map((img) => img.getAttribute('alt'))
    ).toEqual(['コラプトシェル', 'パージ', 'ディスデイン']);
    expect(priority.getAllByText('>')).toHaveLength(2);
  });

  it('スキル欄の頭にパッシブのアイコンが出る', () => {
    renderPanel(toChampionSkills(urgotFixture));
    expect(screen.getByText('パッシブ')).toBeInTheDocument();
    expect(screen.getByAltText('エコーフレイム')).toHaveAttribute(
      'src',
      expect.stringContaining('Urgot_Passive.png')
    );
    expect(screen.getByText('P')).toBeInTheDocument();
  });
});

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  TARGET_PUUID,
  makeMatchDetail,
} from '@/lib/match-detail/__fixtures__/matchDetail';
import type { MatchDetailResponse } from '@/types/matchDetail';
import { BuildTab } from '../build';

function renderBuild(match: MatchDetailResponse = makeMatchDetail()): void {
  render(<BuildTab match={match} targetPuuid={TARGET_PUUID} />);
}

describe('BuildTab: プレイヤーの切り替え', () => {
  it('初期表示は対象プレイヤーのビルド', () => {
    renderBuild();
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
      'Player1Aatrox'
    );
    expect(
      screen.getByRole('button', { name: 'Aatrox（Player1）' })
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('10人のアイコンから、ほかのプレイヤーに切り替えられる', async () => {
    renderBuild();
    expect(screen.getAllByRole('button')).toHaveLength(10);
    await userEvent.click(
      screen.getByRole('button', { name: 'Jinx（Player4）' })
    );
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
      'Player4Jinx'
    );
    expect(
      screen.getByRole('button', { name: 'Jinx（Player4）' })
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: 'Aatrox（Player1）' })
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('対象プレイヤーがいなければ先頭の1人を表示する', () => {
    render(<BuildTab match={makeMatchDetail()} targetPuuid="none" />);
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
      'Player6'
    );
  });
});

describe('BuildTab: アイテムとスキル', () => {
  it('アイテムの購入順を分ごとのまとまりで「>」でつなぎ、下に「N分」を出す', () => {
    renderBuild();
    expect(screen.getByText('0分')).toBeInTheDocument();
    expect(screen.getByText('6分')).toBeInTheDocument();
    expect(screen.getByText('12分')).toBeInTheDocument();
    expect(screen.getAllByText('>')).toHaveLength(2);
    expect(screen.getAllByAltText(/^アイテム/)).toHaveLength(5);
  });

  it('スキルは最大化の順とレベルごとの Q/W/E/R を出し、R を強調する', () => {
    renderBuild();
    expect(screen.getByText('Q > W > E')).toBeInTheDocument();
    const levels = screen.getAllByLabelText(/^レベル\d+: /);
    expect(levels.map((l) => l.textContent).join('')).toBe('QWEQQRQW');
    const r = screen.getByLabelText('レベル6: R');
    expect(r).toHaveClass('text-highlight', 'font-bold');
    expect(screen.getByLabelText('レベル1: Q')).not.toHaveClass(
      'text-highlight'
    );
  });

  it('build が null ならアイテムとスキルは「データなし」、ルーンは表示する', async () => {
    const match = makeMatchDetail();
    match.participants[0] = { ...match.participants[0], build: null };
    renderBuild(match);
    expect(screen.getAllByText('データなし')).toHaveLength(2);
    expect(screen.queryByText('0分')).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'メイン' })).toBeInTheDocument();
    expect(screen.getByAltText('Conqueror')).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'LeeSin（Player2）' })
    );
    expect(screen.queryByText('データなし')).not.toBeInTheDocument();
  });
});

function selectedAlts(group: string): string[] {
  return within(screen.getByRole('group', { name: group }))
    .getAllByRole('img')
    .filter((img) => img.closest('[data-selected="true"]'))
    .map((img) => img.getAttribute('alt') ?? '');
}

describe('BuildTab: ルーン', () => {
  it('メイン・サブのツリーの全ルーンを並べ、選んだものだけ不透明にする', () => {
    renderBuild();
    expect(selectedAlts('メイン')).toEqual([
      'Conqueror',
      'Triumph',
      'Legend: Alacrity',
      'Coup de Grace',
    ]);
    expect(selectedAlts('サブ')).toEqual(['Taste of Blood', 'Treasure Hunter']);
    // 選ばなかったルーンも薄く並ぶ
    const other = screen.getByAltText('Press the Attack');
    expect(other.closest('[data-selected]')).toHaveAttribute(
      'data-selected',
      'false'
    );
    expect(other.closest('[data-selected]')).toHaveClass('opacity-30');
    expect(
      screen.getByAltText('Conqueror').closest('[data-selected]')
    ).toHaveClass('opacity-100');
  });

  it('シャードは3行で、同じシャードが複数行にあっても選んだ行だけ強調する', () => {
    renderBuild();
    const shards = within(screen.getByRole('group', { name: 'シャード' }));
    expect(selectedAlts('シャード')).toEqual([
      'Adaptive Force',
      'Move Speed',
      'Health',
    ]);
    // Adaptive Force は攻撃・柔軟の2行にあり、選んだのは攻撃の行だけ
    const adaptive = shards.getAllByAltText('Adaptive Force');
    expect(adaptive).toHaveLength(2);
    expect(adaptive[0].closest('[data-selected]')).toHaveAttribute(
      'data-selected',
      'true'
    );
    expect(adaptive[1].closest('[data-selected]')).toHaveAttribute(
      'data-selected',
      'false'
    );
  });
});

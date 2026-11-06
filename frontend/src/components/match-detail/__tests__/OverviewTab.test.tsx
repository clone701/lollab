import { render, screen, within } from '@testing-library/react';
import {
  TARGET_PUUID,
  makeMatchDetail,
  makeParticipant,
} from '@/lib/match-detail/__fixtures__/matchDetail';
import type { MatchDetailResponse } from '@/types/matchDetail';
import { OverviewTab } from '../overview';

function renderOverview(
  match: MatchDetailResponse = makeMatchDetail(),
  region: 'JP' | 'KR' = 'JP'
): void {
  render(
    <OverviewTab match={match} targetPuuid={TARGET_PUUID} region={region} />
  );
}

function withParticipant(
  index: number,
  overrides: Parameters<typeof makeParticipant>[0]
): MatchDetailResponse {
  const match = makeMatchDetail();
  match.participants[index] = {
    ...match.participants[index],
    ...overrides,
  };
  return match;
}

describe('OverviewTab: チーム', () => {
  it('勝利チームを先に、各5人を表示し、勝敗とチームの色を示す', () => {
    renderOverview();
    const sections = screen.getAllByRole('region', { name: /チーム$/ });
    expect(sections.map((s) => s.getAttribute('aria-label'))).toEqual([
      'レッドチーム',
      'ブルーチーム',
    ]);
    expect(sections[0]).toHaveClass('bg-win/15');
    expect(sections[1]).toHaveClass('bg-loss/15');
    expect(within(sections[0]).getByText('勝利')).toBeInTheDocument();
    expect(within(sections[1]).getByText('敗北')).toBeInTheDocument();
    sections.forEach((s) =>
      expect(within(s).getAllByRole('listitem').length).toBeGreaterThanOrEqual(
        5
      )
    );
  });

  it('表は横にスクロールできる', () => {
    renderOverview();
    const table = screen.getAllByRole('region', { name: /チーム$/ })[0];
    expect(table.closest('.overflow-x-auto')).not.toBeNull();
  });
});

describe('OverviewTab: 対象プレイヤーの強調', () => {
  it('対象プレイヤーの行だけを ring-2 ring-accent bg-accent/15 にする', () => {
    const { container } = render(
      <OverviewTab
        match={makeMatchDetail()}
        targetPuuid={TARGET_PUUID}
        region="JP"
      />
    );
    const targets = container.querySelectorAll('[data-target="true"]');
    expect(targets).toHaveLength(1);
    expect(targets[0]).toHaveClass('ring-2', 'ring-accent', 'bg-accent/15');
    expect(
      within(targets[0] as HTMLElement).getByText('Player1')
    ).toBeInTheDocument();
    const others = container.querySelectorAll('[data-target="false"]');
    expect(others).toHaveLength(9);
    others.forEach((row) => expect(row).not.toHaveClass('ring-2'));
  });

  it('対象プレイヤーがいない試合では誰も強調しない', () => {
    const { container } = render(
      <OverviewTab match={makeMatchDetail()} targetPuuid="none" region="JP" />
    );
    expect(container.querySelectorAll('[data-target="true"]')).toHaveLength(0);
  });
});

describe('OverviewTab: 成績の表示', () => {
  it('KDA とキル関与率を `0/10/2 (20%)` の形で出す', () => {
    renderOverview(
      withParticipant(0, {
        kills: 0,
        deaths: 10,
        assists: 2,
        kill_participation: 0.2,
      })
    );
    expect(screen.getByText('0/10/2 (20%)')).toBeInTheDocument();
    expect(screen.getByText('0.20:1')).toBeInTheDocument();
  });

  it('デスが0なら KDA の比率を Perfect と出す', () => {
    renderOverview(withParticipant(0, { kills: 3, deaths: 0, assists: 4 }));
    expect(screen.getByText('Perfect')).toBeInTheDocument();
  });

  it('ランクが分かるときだけ名前の近くに出す', () => {
    renderOverview(
      withParticipant(0, { rank: { tier: 'MASTER', division: null } })
    );
    expect(screen.getByText('マスター')).toBeInTheDocument();
    expect(screen.queryByText(/エメラルド/)).not.toBeInTheDocument();
  });

  it('ディビジョンのあるランクは「エメラルド 1」の形で出す', () => {
    renderOverview(
      withParticipant(1, { rank: { tier: 'EMERALD', division: 'I' } })
    );
    expect(screen.getByText('エメラルド 1')).toBeInTheDocument();
  });

  it('ランクが分からない参加者にはランクを出さない', () => {
    renderOverview();
    expect(screen.queryByText(/マスター|エメラルド|プラチナ/)).toBeNull();
  });

  it('ワードの設置 / 破壊、CS と分あたりの CS を出す', () => {
    renderOverview(
      withParticipant(0, { wards_placed: 12, wards_killed: 3, cs: 210 })
    );
    expect(screen.getByText('12 / 3')).toBeInTheDocument();
    expect(screen.getByText('210')).toBeInTheDocument();
    expect(screen.getByText('7.0/分')).toBeInTheDocument();
  });

  it('アイテムは7枠を並べ、空きの枠には画像を出さない', () => {
    renderOverview(
      withParticipant(0, { item_ids: [3157, 0, 0, 0, 0, 0, 3340] })
    );
    const row = document.querySelector('[data-target="true"]') as HTMLElement;
    expect(within(row).getAllByRole('listitem')).toHaveLength(7);
    expect(within(row).getAllByAltText(/^アイテム/)).toHaveLength(2);
  });

  it('与ダメージ・被ダメージを試合内の最大値に対する棒にする', () => {
    renderOverview();
    const bars = screen.getAllByTestId('damage-bar');
    const widths = bars.map((b) => (b as HTMLElement).style.width);
    // 10人 × (与ダメージ・被ダメージ)。最大の1人が 100%
    expect(bars).toHaveLength(20);
    expect(widths.filter((w) => w === '100%')).toHaveLength(2);
    expect(widths).toContain('10%');
  });
});

describe('OverviewTab: チームの比較', () => {
  it('合計キル・合計ゴールドと、オブジェクトの獲得数を出す', () => {
    renderOverview();
    const section = screen.getByRole('region', { name: 'チームの比較' });
    expect(within(section).getByText('合計キル')).toBeInTheDocument();
    expect(within(section).getByText('合計ゴールド')).toBeInTheDocument();
    expect(within(section).getByText('60,000')).toBeInTheDocument();
    const baron = within(section).getByText('バロン').closest('li');
    expect(baron).toHaveTextContent('0 - 1');
    expect(within(section).getByText('インヒビター')).toBeInTheDocument();
  });

  it('ブルーの割合を棒の長さにする', () => {
    renderOverview();
    // ブルー 12 キル / レッド 30 キル → 29%
    expect(screen.getAllByTestId('comparison-blue')[0].style.width).toBe('29%');
  });
});

describe('OverviewTab: リンク', () => {
  it('チャンピオンのアイコンは、ロールを選んだビルドページへのリンク', () => {
    renderOverview();
    expect(
      screen.getByRole('link', { name: 'LeeSinのビルド' })
    ).toHaveAttribute('href', '/champion/LeeSin?role=JUNGLE');
  });

  it('Riot の名前が異なるチャンピオンは画面の ID でリンクする', () => {
    renderOverview();
    expect(
      screen.getByRole('link', { name: 'MonkeyKingのビルド' })
    ).toHaveAttribute('href', '/champion/Wukong?role=MIDDLE');
  });

  it('team_position が空ならロールを付けない', () => {
    renderOverview(withParticipant(0, { team_position: '' }));
    expect(
      screen.getByRole('link', { name: 'Aatroxのビルド' })
    ).toHaveAttribute('href', '/champion/Aatrox');
  });

  it('名前は、検索中の region で検索結果を開くリンク', () => {
    renderOverview(makeMatchDetail({ match_id: 'JP1_999' }), 'KR');
    expect(screen.getByRole('link', { name: 'Player1' })).toHaveAttribute(
      'href',
      '/?region=KR&q=Player1%23T1'
    );
  });

  it('名前が無い参加者はリンクにしない', () => {
    renderOverview(
      withParticipant(1, { riot_id_game_name: null, riot_id_tagline: null })
    );
    expect(screen.getByText('名前なし')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '名前なし' })).toBeNull();
  });
});

import { render, screen, within } from '@testing-library/react';
import { MOCK_MATCHES, MOCK_PARTICIPANTS } from '@/lib/summoner-search';
import type { MatchData } from '@/types/summoner';
import MatchCard from '../MatchCard';

function renderCard(overrides: Partial<MatchData> = {}): HTMLElement {
  const match = { ...MOCK_MATCHES[0], ...overrides };
  render(<MatchCard match={match} puuid="puuid-1" region="JP" />);
  return screen.getByRole('article');
}

describe('MatchCard: 表示項目', () => {
  it('左の列にキュー・経過時間・勝敗・試合時間を出す', () => {
    const card = renderCard();
    expect(within(card).getByText('ランク (ソロ/デュオ)')).toBeInTheDocument();
    expect(within(card).getByText('1時間前')).toBeInTheDocument();
    expect(within(card).getByText('勝利')).toHaveClass('text-win');
    expect(within(card).getByText('30:20')).toBeInTheDocument();
  });

  it('敗北は敗北の色、カードの背景と帯も勝敗の色にする', () => {
    const card = renderCard({ isWin: false });
    expect(within(card).getByText('敗北')).toHaveClass('text-loss');
    expect(card).toHaveClass('bg-loss/15', 'border-loss');
    expect(card).not.toHaveClass('bg-win/15');
  });

  it('勝利のカードは勝利の色', () => {
    expect(renderCard()).toHaveClass('bg-win/15', 'border-win');
  });

  it('ランク戦以外は gameMode を出す', () => {
    const card = renderCard({ queueId: 450, gameMode: 'ARAM' });
    expect(within(card).getByText('ARAM')).toBeInTheDocument();
  });

  it('KDA（デスは敗北色）と KDA の比率を出す', () => {
    const card = renderCard({ kills: 6, deaths: 3, assists: 7 });
    expect(within(card).getByText('3')).toHaveClass('text-loss');
    expect(card).toHaveTextContent('6 / 3 / 7');
    expect(within(card).getByText('4.33:1 KDA')).toBeInTheDocument();
  });

  it('デスが0なら Perfect', () => {
    const card = renderCard({ deaths: 0 });
    expect(within(card).getByText('Perfect')).toBeInTheDocument();
  });

  it('キル関与率・CS・試合のランクを出す', () => {
    const card = renderCard({ cs: 157, gameDurationSeconds: 1320 });
    expect(within(card).getByText('キル関与 81%')).toBeInTheDocument();
    expect(within(card).getByText('CS 157 (7.1)')).toBeInTheDocument();
    expect(within(card).getByText('ダイヤモンド 3')).toBeInTheDocument();
  });

  it('試合のランクが無ければ出さない', () => {
    const card = renderCard({ averageRank: null });
    expect(card).not.toHaveTextContent('ダイヤモンド');
  });

  it('スペル2つ・ルーン2つ・アイテム7枠を出す', () => {
    const card = renderCard({ itemIds: [3157, 0, 3089, 0, 0, 0, 3363] });
    expect(within(card).getByAltText('Flash')).toBeInTheDocument();
    expect(within(card).getByAltText('Ignite')).toBeInTheDocument();
    expect(within(card).getByAltText('Electrocute')).toBeInTheDocument();
    expect(within(card).getByAltText('Sorcery')).toBeInTheDocument();
    expect(within(card).getAllByRole('listitem').length).toBeGreaterThanOrEqual(
      7
    );
    expect(within(card).getByAltText('アイテム3157')).toBeInTheDocument();
    expect(within(card).queryByAltText('アイテム0')).toBeNull();
  });

  it('ウーコンは画像の ID（Wukong）で出す', () => {
    const card = renderCard({ championName: 'MonkeyKing' });
    const icon = within(card).getAllByAltText('ウーコン')[0];
    expect(icon.getAttribute('src')).toContain('Wukong');
    expect(within(card).queryByAltText('MonkeyKing')).toBeNull();
  });
});

describe('MatchCard: 参加者', () => {
  it('ブルー・レッド各5人のチャンピオンと名前を出す', () => {
    const card = renderCard();
    const blue = within(card).getByText('Member1').closest('ul');
    const red = within(card).getByText('Member6').closest('ul');
    expect(blue).not.toBe(red);
    expect(within(blue as HTMLElement).getAllByRole('listitem')).toHaveLength(
      5
    );
    expect(within(red as HTMLElement).getAllByRole('listitem')).toHaveLength(5);
    for (const p of MOCK_PARTICIPANTS) {
      expect(
        within(card).getByText(p.riotIdGameName ?? '')
      ).toBeInTheDocument();
    }
  });

  it('参加者のチャンピオンも日本語名で出し、画像は Wukong.png のまま', () => {
    const participants = MOCK_PARTICIPANTS.map((p, i) =>
      i === 1 ? { ...p, championName: 'MonkeyKing' } : p
    );
    const card = renderCard({ participants });
    const row = within(card).getByText('Member2').closest('li');
    const icon = within(row as HTMLElement).getByAltText('ウーコン');
    expect(icon.getAttribute('src')).toContain('/images/champion/Wukong.png');
    expect(within(card).queryByAltText('MonkeyKing')).toBeNull();
  });

  it('名前は検索結果へのリンクで、title に全名を持つ', () => {
    const card = renderCard();
    const link = within(card).getByRole('link', { name: 'Member2' });
    expect(link).toHaveAttribute('href', '/?region=JP&q=Member2%23KR1');
    expect(link).toHaveAttribute('title', 'Member2#KR1');
  });

  it('検索したサモナー（puuid 一致）だけを強調する', () => {
    const card = renderCard();
    expect(within(card).getByText('Member1')).toHaveClass('font-bold');
    expect(within(card).getByText('Member2')).not.toHaveClass('font-bold');
  });

  it('名前が無い参加者はリンクにしない', () => {
    const participants = MOCK_PARTICIPANTS.map((p, i) =>
      i === 1 ? { ...p, riotIdGameName: null, riotIdTagline: null } : p
    );
    const card = renderCard({ participants });
    expect(within(card).getByText('名前なし').closest('a')).toBeNull();
    expect(within(card).getAllByRole('link')).toHaveLength(9);
  });

  it('狭い画面（sm 未満）では参加者の列を隠す', () => {
    const card = renderCard();
    const column = within(card).getByText('Member1').closest('div');
    expect(column).toHaveClass('hidden', '@2xl:grid');
  });
});

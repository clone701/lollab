import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fetchChampionBuild } from '@/adapters/api';
import { getChampionById } from '@/lib/utils/championHelpers';
import type { BuildQuery } from '@/types/championBuild';
import { makeBuildResponse } from '../__fixtures__/buildResponse';
import { ChampionBuildContent } from '../ChampionBuildContent';

const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn() }),
}));
jest.mock('@/adapters/api', () => ({ fetchChampionBuild: jest.fn() }));
// スキル画像の JSON は読み込まれない状態（文字の表示）にする
jest.mock('@/adapters/game-data', () => ({
  fetchChampionData: jest.fn(() => new Promise(() => {})),
  fetchSkillValues: jest.fn(() => new Promise(() => {})),
}));

const mockFetch = fetchChampionBuild as jest.Mock;
const DEFAULT_QUERY: BuildQuery = {
  period: 'latest_patch',
  queue: 'all',
  rank: 'all',
};

async function renderContent(
  championId = 'Ahri',
  query: BuildQuery = DEFAULT_QUERY
): Promise<void> {
  const champion = getChampionById(championId);
  if (!champion) throw new Error(`champion not found: ${championId}`);
  render(<ChampionBuildContent champion={champion} query={query} />);
  await screen.findByText(/集計対象/);
}

function sectionOf(title: string): HTMLElement {
  const section = screen
    .getByRole('heading', { name: title })
    .closest('section');
  if (!section) throw new Error(`section not found: ${title}`);
  return section;
}

describe('ChampionBuildContent', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockReplace.mockReset();
    mockFetch.mockResolvedValue(makeBuildResponse());
  });

  describe('最高勝率 / 最多の切り替え', () => {
    it('初期表示は最高勝率ビルドで、勝率と試合数を併記する', async () => {
      await renderContent();
      const skill = within(sectionOf('スキル'));
      expect(skill.getByRole('group', { name: 'E > W > Q' })).toBeVisible();
      // 15 / 20 = 75.0%
      expect(skill.getByText('勝率 75.0%')).toBeInTheDocument();
      expect(skill.getByText('20試合')).toBeInTheDocument();
      expect(
        within(sectionOf('サモナースペル')).getByText('勝率 70.0%')
      ).toBeInTheDocument();
    });

    it('「最多ビルド」に切り替えると options[0] の内容と勝率に変わる', async () => {
      await renderContent();
      await userEvent.click(screen.getByRole('button', { name: '最多ビルド' }));

      const skill = within(sectionOf('スキル'));
      expect(skill.getByRole('group', { name: 'Q > W > E' })).toBeVisible();
      expect(
        skill.queryByRole('group', { name: 'E > W > Q' })
      ).not.toBeInTheDocument();
      // 40 / 80 = 50.0%
      expect(skill.getAllByText('勝率 50.0%').length).toBeGreaterThan(0);
      expect(skill.getAllByText('80試合').length).toBeGreaterThan(0);

      const spells = within(sectionOf('サモナースペル'));
      expect(spells.getByAltText('Ignite')).toBeInTheDocument();
      expect(spells.queryByAltText('Teleport')).not.toBeInTheDocument();
    });

    it('「最高勝率ビルド」に戻すと best_win_rate の内容に戻る', async () => {
      await renderContent();
      await userEvent.click(screen.getByRole('button', { name: '最多ビルド' }));
      await userEvent.click(
        screen.getByRole('button', { name: '最高勝率ビルド' })
      );
      const spells = within(sectionOf('サモナースペル'));
      expect(spells.getByAltText('Teleport')).toBeInTheDocument();
    });
  });

  describe('データなし', () => {
    it('options が空の要素は「データなし」を表示する', async () => {
      mockFetch.mockResolvedValue(
        makeBuildResponse({
          runes: { games: 0, options: [], best_win_rate: null },
        })
      );
      await renderContent();
      expect(
        within(sectionOf('ルーン')).getByText('データなし')
      ).toBeInTheDocument();
      // 6番目のアイテムだけが空
      const items = within(sectionOf('アイテム'));
      expect(items.getAllByText('データなし')).toHaveLength(1);
    });

    it('試合数0の応答では全要素が「データなし」になる', async () => {
      const empty = { games: 0, options: [], best_win_rate: null };
      mockFetch.mockResolvedValue(
        makeBuildResponse({
          role: null,
          roles: {},
          latest_patch: null,
          summary: {
            games: 0,
            wins: 0,
            win_rate_delta: 0,
            pick_rate: 0,
            ban_rate: 0,
          },
          skill_priority: empty,
          skill_order: empty,
          spells: empty,
          starting_items: empty,
          core_items: empty,
          item4: empty,
          item5: empty,
          item6: empty,
          runes: empty,
        })
      );
      await renderContent();
      // スキル2 + スペル1 + アイテム5 + ルーン1
      expect(screen.getAllByText('データなし')).toHaveLength(9);
      expect(screen.getByText('集計対象: 0試合')).toBeInTheDocument();
    });
  });

  describe('表示内容', () => {
    it('概要の比率を % で表示する', async () => {
      await renderContent();
      expect(screen.getByText('52.3%')).toBeInTheDocument(); // 523 / 1000
      expect(screen.getByText('+1.2%')).toBeInTheDocument();
      expect(screen.getByText('8.3%')).toBeInTheDocument();
      expect(screen.getByText('15.7%')).toBeInTheDocument();
      expect(screen.getByText('1,000')).toBeInTheDocument();
    });

    it('最新パッチ指定のときだけパッチ番号を表示する', async () => {
      await renderContent();
      expect(screen.getByText('集計対象: 1,000試合')).toBeInTheDocument();
      expect(screen.getByText('パッチ 16.22')).toBeInTheDocument();
    });

    it('期間が最新パッチ以外ならパッチ番号を表示しない', async () => {
      mockFetch.mockResolvedValue(makeBuildResponse({ period: 'all' }));
      await renderContent('Ahri', { period: 'all', queue: 'all', rank: 'all' });
      expect(screen.queryByText(/パッチ 16/)).not.toBeInTheDocument();
    });

    it('ロール切り替えは応答の roles のロールだけを試合数付きで出す', async () => {
      await renderContent();
      const nav = within(screen.getByRole('navigation', { name: 'ロール' }));
      expect(nav.getAllByRole('link')).toHaveLength(2);
      expect(nav.getByRole('link', { name: /ミッド/ })).toHaveAttribute(
        'aria-current',
        'page'
      );
      expect(nav.getByText('900試合')).toBeInTheDocument();
      expect(nav.getByRole('link', { name: /ボット/ })).toHaveAttribute(
        'href',
        '/champion/Ahri?role=BOTTOM'
      );
    });

    it('4〜6番目のアイテムは上位3件を OR で並べる', async () => {
      await renderContent();
      const items = within(sectionOf('アイテム'));
      // item4 だけが3件以上ある → 4件目は出さず、OR は2つ
      expect(items.getAllByText('OR')).toHaveLength(2);
      expect(items.getByAltText('アイテム3089')).toBeInTheDocument();
      expect(items.getByAltText('アイテム3165')).toBeInTheDocument();
      expect(items.queryByAltText('アイテム3102')).not.toBeInTheDocument();
    });

    it('コアビルドは3つのアイテムを → でつなぐ', async () => {
      await renderContent();
      const items = within(sectionOf('アイテム'));
      expect(items.getAllByText('→')).toHaveLength(2);
    });

    it('スキル順は該当レベルのマスだけを塗る', async () => {
      mockFetch.mockResolvedValue(makeBuildResponse());
      await renderContent();
      await userEvent.click(screen.getByRole('button', { name: '最多ビルド' }));
      const skill = within(sectionOf('スキル'));
      expect(skill.getByLabelText('レベル1: Q')).toBeInTheDocument();
      expect(skill.getByLabelText('レベル6: R')).toBeInTheDocument();
      expect(skill.queryByLabelText('レベル1: W')).not.toBeInTheDocument();
    });

    it('ルーンはメイン・サブ・シャードに分けて並べる', async () => {
      await renderContent();
      const runes = within(sectionOf('ルーン'));
      expect(runes.getByText('メイン')).toBeInTheDocument();
      expect(runes.getByText('サブ')).toBeInTheDocument();
      expect(runes.getByText('シャード')).toBeInTheDocument();
      expect(runes.getByAltText('Electrocute')).toBeInTheDocument();
      expect(runes.getByAltText('Sorcery')).toBeInTheDocument();
      expect(runes.getAllByAltText('Adaptive Force')).toHaveLength(2);
    });
  });

  describe('URL クエリ', () => {
    it('role・period・queue・rank を API 呼び出しに渡す', async () => {
      await renderContent('Ahri', {
        role: 'MIDDLE',
        period: 'last_30_days',
        queue: 'solo',
        rank: 'master_plus',
      });
      expect(mockFetch).toHaveBeenCalledWith(
        'Ahri',
        {
          role: 'MIDDLE',
          period: 'last_30_days',
          queue: 'solo',
          rank: 'master_plus',
        },
        expect.anything()
      );
    });

    it('URL クエリの値をプルダウンの選択状態に反映する', async () => {
      await renderContent('Ahri', {
        role: 'MIDDLE',
        period: 'last_30_days',
        queue: 'flex',
        rank: 'emerald_plus',
      });
      expect(screen.getByLabelText('期間')).toHaveValue('last_30_days');
      expect(screen.getByLabelText('キュー')).toHaveValue('flex');
      expect(screen.getByLabelText('ランク帯')).toHaveValue('emerald_plus');
    });

    it('期間を変えると URL クエリを更新する（ロール・キューは維持）', async () => {
      await renderContent('Ahri', {
        role: 'MIDDLE',
        period: 'latest_patch',
        queue: 'solo',
        rank: 'all',
      });
      await userEvent.selectOptions(screen.getByLabelText('期間'), 'all');
      expect(mockReplace).toHaveBeenCalledWith(
        '/champion/Ahri?role=MIDDLE&period=all&queue=solo'
      );
    });

    it('キューを変えると URL クエリを更新する', async () => {
      await renderContent();
      await userEvent.selectOptions(screen.getByLabelText('キュー'), 'flex');
      expect(mockReplace).toHaveBeenCalledWith('/champion/Ahri?queue=flex');
    });

    it('ランク帯のプルダウンは4つの選択肢を持つ', async () => {
      await renderContent();
      const select = screen.getByLabelText('ランク帯');
      expect(
        within(select)
          .getAllByRole('option')
          .map((o) => o.textContent)
      ).toEqual([
        'すべて',
        'エメラルド以上',
        'ダイヤモンド以上',
        'マスター以上',
      ]);
      expect(select).toHaveValue('all');
    });

    it('ランク帯を変えると URL クエリを更新する（他の条件は維持）', async () => {
      await renderContent('Ahri', {
        role: 'MIDDLE',
        period: 'all',
        queue: 'solo',
        rank: 'all',
      });
      await userEvent.selectOptions(
        screen.getByLabelText('ランク帯'),
        'diamond_plus'
      );
      expect(mockReplace).toHaveBeenCalledWith(
        '/champion/Ahri?role=MIDDLE&period=all&queue=solo&rank=diamond_plus'
      );
    });

    it('ランク帯を「すべて」に戻すと rank をクエリから外す', async () => {
      await renderContent('Ahri', { ...DEFAULT_QUERY, rank: 'master_plus' });
      await userEvent.selectOptions(screen.getByLabelText('ランク帯'), 'all');
      expect(mockReplace).toHaveBeenCalledWith('/champion/Ahri');
    });

    it('ランク帯が変わると取得し直す', async () => {
      const champion = getChampionById('Ahri')!;
      const { rerender } = render(
        <ChampionBuildContent champion={champion} query={DEFAULT_QUERY} />
      );
      await screen.findByText(/集計対象/);
      rerender(
        <ChampionBuildContent
          champion={champion}
          query={{ ...DEFAULT_QUERY, rank: 'emerald_plus' }}
        />
      );
      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
      expect(mockFetch.mock.calls[1][1]).toMatchObject({
        rank: 'emerald_plus',
      });
    });

    it('条件が変わると取得し直し、その間は読み込み中を表示する', async () => {
      const champion = getChampionById('Ahri')!;
      const { rerender } = render(
        <ChampionBuildContent champion={champion} query={DEFAULT_QUERY} />
      );
      await screen.findByText(/集計対象/);
      mockFetch.mockReturnValue(new Promise(() => {}));
      rerender(
        <ChampionBuildContent
          champion={champion}
          query={{ ...DEFAULT_QUERY, period: 'all' }}
        />
      );
      expect(screen.getByText('読み込み中...')).toBeInTheDocument();
      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
    });

    it('Riot の championName が異なるチャンピオンは変換して API に渡す', async () => {
      await renderContent('Wukong');
      expect(mockFetch.mock.calls[0][0]).toBe('MonkeyKing');
    });
  });

  it('API エラーはメッセージを表示する', async () => {
    mockFetch.mockRejectedValue(new Error('チャンピオンが見つかりません'));
    const champion = getChampionById('Ahri')!;
    render(<ChampionBuildContent champion={champion} query={DEFAULT_QUERY} />);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'チャンピオンが見つかりません'
    );
  });
});

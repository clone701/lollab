import {
  buildParticipantBuildHref,
  buildParticipantSearchHref,
  getPrimaryTreeRows,
  getShardRows,
  getSubTreeRows,
  pickTeamPair,
  splitTeams,
  teamName,
  toChampionId,
} from '..';
import { makeMatchDetail, makeParticipant } from '../__fixtures__/matchDetail';

describe('splitTeams', () => {
  it('勝利チームを先頭にし、各5人に分ける', () => {
    const groups = splitTeams(makeMatchDetail());
    expect(groups.map((g) => g.team.team_id)).toEqual([200, 100]);
    expect(groups.map((g) => g.team.win)).toEqual([true, false]);
    expect(groups.every((g) => g.participants.length === 5)).toBe(true);
    expect(groups[0].participants.every((p) => p.team_id === 200)).toBe(true);
  });

  it('参加者の並び（ロール順）を保つ', () => {
    const [win] = splitTeams(makeMatchDetail());
    expect(win.participants.map((p) => p.team_position)).toEqual([
      'TOP',
      'JUNGLE',
      'MIDDLE',
      'BOTTOM',
      'UTILITY',
    ]);
  });
});

describe('pickTeamPair・teamName', () => {
  it('ブルーとレッドを取り出し、片方なければ null', () => {
    const { teams } = makeMatchDetail();
    expect(pickTeamPair(teams)?.blue.team_id).toBe(100);
    expect(pickTeamPair(teams)?.red.team_id).toBe(200);
    expect(pickTeamPair([teams[0]])).toBeNull();
  });

  it('チーム名はブルー・レッド', () => {
    expect(teamName(100)).toBe('ブルーチーム');
    expect(teamName(200)).toBe('レッドチーム');
  });
});

describe('toChampionId', () => {
  it('Riot の名前が異なるチャンピオンだけ ID に戻す', () => {
    expect(toChampionId('MonkeyKing')).toBe('Wukong');
    expect(toChampionId('FiddleSticks')).toBe('Fiddlesticks');
    expect(toChampionId('Ahri')).toBe('Ahri');
  });
});

describe('buildParticipantBuildHref', () => {
  it('ロールを付けたビルドページへ（period・queue・rank は既定値で省略）', () => {
    const p = makeParticipant({
      champion_name: 'LeeSin',
      team_position: 'JUNGLE',
    });
    expect(buildParticipantBuildHref(p)).toBe('/champion/LeeSin?role=JUNGLE');
  });

  it('team_position が空・未知ならロールを付けない', () => {
    expect(
      buildParticipantBuildHref(
        makeParticipant({ champion_name: 'Ahri', team_position: '' })
      )
    ).toBe('/champion/Ahri');
    expect(
      buildParticipantBuildHref(
        makeParticipant({ champion_name: 'Ahri', team_position: 'Invalid' })
      )
    ).toBe('/champion/Ahri');
  });

  it('Riot の名前が異なるチャンピオンは画面の ID にする', () => {
    const p = makeParticipant({
      champion_name: 'MonkeyKing',
      team_position: 'TOP',
    });
    expect(buildParticipantBuildHref(p)).toBe('/champion/Wukong?role=TOP');
  });
});

describe('buildParticipantSearchHref', () => {
  it('検索中の region と gameName#tagLine のエンコードで作る', () => {
    const p = makeParticipant({
      riot_id_game_name: 'Hide on bush',
      riot_id_tagline: 'KR1',
    });
    expect(buildParticipantSearchHref(p, 'JP')).toBe(
      '/?region=JP&q=Hide%20on%20bush%23KR1'
    );
  });

  it('名前かタグがなければ null', () => {
    const noName = makeParticipant({ riot_id_game_name: null });
    const noTag = makeParticipant({ riot_id_tagline: null });
    expect(buildParticipantSearchHref(noName, 'JP')).toBeNull();
    expect(buildParticipantSearchHref(noTag, 'JP')).toBeNull();
  });
});

describe('ルーンのツリー', () => {
  it('メインはキーストーン + 3行、サブは3行', () => {
    expect(getPrimaryTreeRows(8000)).toHaveLength(4);
    expect(getSubTreeRows(8100)).toHaveLength(3);
    expect(getPrimaryTreeRows(8000)[0].map((r) => r.id)).toContain(8010);
  });

  it('未知のツリーは空', () => {
    expect(getPrimaryTreeRows(0)).toEqual([]);
    expect(getSubTreeRows(0)).toEqual([]);
  });

  it('シャードは3行', () => {
    expect(getShardRows()).toHaveLength(3);
  });
});

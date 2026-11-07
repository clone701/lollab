import type {
  MatchDetailResponse,
  ParticipantBuild,
  ParticipantDetail,
  TeamDetail,
} from '@/types/matchDetail';

export const TARGET_PUUID = 'puuid-1';

export const SAMPLE_BUILD: ParticipantBuild = {
  item_purchases: [
    { minute: 0, item_ids: [1055, 2003] },
    { minute: 6, item_ids: [3006, 1036] },
    { minute: 12, item_ids: [3157] },
  ],
  skill_order: [1, 2, 3, 1, 1, 4, 1, 2],
  skill_priority: [1, 2, 3],
};

/** 参加者1人分。overrides で差し替える */
export function makeParticipant(
  overrides: Partial<ParticipantDetail> = {}
): ParticipantDetail {
  return {
    puuid: 'puuid-x',
    riot_id_game_name: 'Player',
    riot_id_tagline: 'JP1',
    team_id: 100,
    team_position: 'TOP',
    champion_name: 'Aatrox',
    champ_level: 15,
    spell_ids: [4, 12],
    primary_style_id: 8000,
    sub_style_id: 8100,
    primary_perk_ids: [8010, 9111, 9104, 8014],
    sub_perk_ids: [8139, 8135],
    stat_perk_ids: [5008, 5010, 5011],
    kills: 5,
    deaths: 2,
    assists: 3,
    kill_participation: 0.5,
    damage_to_champions: 10000,
    damage_taken: 8000,
    wards_placed: 7,
    wards_killed: 2,
    control_wards_bought: 2,
    cs: 180,
    gold_earned: 11000,
    item_ids: [3157, 6655, 0, 0, 0, 0, 3340],
    rank: null,
    build: SAMPLE_BUILD,
    ...overrides,
  };
}

function makeTeam(teamId: number, win: boolean): TeamDetail {
  return {
    team_id: teamId,
    win,
    kills: win ? 30 : 12,
    gold: win ? 60000 : 50000,
    objectives: {
      baron: win ? 1 : 0,
      dragon: win ? 3 : 1,
      rift_herald: 1,
      horde: 0,
      atakhan: 0,
      tower: win ? 9 : 2,
      inhibitor: win ? 2 : 0,
    },
  };
}

const POSITIONS = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'];
const BLUE_CHAMPIONS = ['Aatrox', 'LeeSin', 'Ahri', 'Jinx', 'Thresh'];
const RED_CHAMPIONS = ['Garen', 'Viego', 'MonkeyKing', 'Caitlyn', 'Lux'];

function makeTeamParticipants(
  teamId: number,
  champions: string[],
  offset: number
): ParticipantDetail[] {
  return champions.map((champion, i) =>
    makeParticipant({
      puuid: `puuid-${offset + i + 1}`,
      riot_id_game_name: `Player${offset + i + 1}`,
      riot_id_tagline: `T${offset + i + 1}`,
      team_id: teamId,
      team_position: POSITIONS[i],
      champion_name: champion,
      damage_to_champions: 10000 * (offset + i + 1),
      damage_taken: 5000 * (offset + i + 1),
    })
  );
}

/** ブルー（100）が敗北、レッド（200）が勝利の試合。対象プレイヤーは puuid-1 */
export function makeMatchDetail(
  overrides: Partial<MatchDetailResponse> = {}
): MatchDetailResponse {
  return {
    match_id: 'JP1_100',
    queue_id: 420,
    game_duration: 1800,
    game_end_at: '2025-01-01T00:00:00Z',
    teams: [makeTeam(100, false), makeTeam(200, true)],
    participants: [
      ...makeTeamParticipants(100, BLUE_CHAMPIONS, 0),
      ...makeTeamParticipants(200, RED_CHAMPIONS, 5),
    ],
    ...overrides,
  };
}

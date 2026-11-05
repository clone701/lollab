import type {
  BuildElement,
  BuildOption,
  ChampionBuildResponse,
} from '@/types/championBuild';

export function option(
  key: number[],
  games: number,
  wins: number
): BuildOption {
  return { key, games, wins };
}

export function element(
  options: BuildOption[],
  bestWinRate: BuildOption | null = options[0] ?? null
): BuildElement {
  const games = options.reduce((sum, o) => sum + o.games, 0);
  return { games, options, best_win_rate: bestWinRate };
}

/** 最多と最高勝率が異なるビルド要素を持つ応答。overrides で要素を差し替える */
export function makeBuildResponse(
  overrides: Partial<ChampionBuildResponse> = {}
): ChampionBuildResponse {
  return {
    champion_name: 'Ahri',
    role: 'MIDDLE',
    roles: { MIDDLE: 900, BOTTOM: 100 },
    period: 'latest_patch',
    queue: 'all',
    latest_patch: '16.22',
    summary: {
      games: 1000,
      wins: 523,
      win_rate_delta: 0.0123,
      pick_rate: 0.0834,
      ban_rate: 0.1567,
    },
    skill_priority: element(
      [option([1, 2, 3], 80, 40), option([3, 2, 1], 20, 15)],
      option([3, 2, 1], 20, 15)
    ),
    skill_order: element([
      option([1, 2, 3, 1, 1, 4, 1, 2, 1, 2, 4, 2, 2, 3, 3], 50, 25),
    ]),
    spells: element(
      [option([4, 14], 70, 35), option([4, 12], 30, 21)],
      option([4, 12], 30, 21)
    ),
    starting_items: element([option([1056, 2003, 2003], 60, 30)]),
    core_items: element([option([6655, 3020, 3157], 40, 22)]),
    item4: element([
      option([3089], 30, 18),
      option([3135], 20, 9),
      option([3165], 10, 5),
      option([3102], 5, 2),
    ]),
    item5: element([option([3157], 25, 12)]),
    item6: element([]),
    runes: element([
      option(
        [8100, 8112, 8126, 8138, 8135, 8200, 8226, 8210, 5008, 5008, 5001],
        45,
        27
      ),
    ]),
    ...overrides,
  };
}

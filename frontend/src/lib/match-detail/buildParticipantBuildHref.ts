import type { ParticipantDetail } from '@/types/matchDetail';
import {
  DEFAULT_PERIOD,
  DEFAULT_QUEUE,
  DEFAULT_RANK,
  buildChampionBuildHref,
} from '@/lib/champion-build';
import { toChampionId } from './toChampionId';
import { toRole } from './toRole';

/** チャンピオンのアイコンのリンク先。そのプレイヤーのロールを選んだビルドページ */
export function buildParticipantBuildHref(
  p: Pick<ParticipantDetail, 'champion_name' | 'team_position'>
): string {
  return buildChampionBuildHref(toChampionId(p.champion_name), {
    role: toRole(p.team_position),
    period: DEFAULT_PERIOD,
    queue: DEFAULT_QUEUE,
    rank: DEFAULT_RANK,
  });
}

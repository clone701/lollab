import type {
  BuildQuery,
  Period,
  QueueFilter,
  RankFilter,
  Role,
} from '@/types/championBuild';
import {
  DEFAULT_PERIOD,
  DEFAULT_QUEUE,
  DEFAULT_RANK,
  PERIOD_OPTIONS,
  QUEUE_OPTIONS,
  RANK_OPTIONS,
  ROLE_LABELS,
} from './constants';

type RawValue = string | string[] | undefined;

function first(value: RawValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** URL クエリの値を検証し、不正・未指定は既定値（role は未指定）にする */
export function parseBuildQuery(raw: {
  role?: RawValue;
  period?: RawValue;
  queue?: RawValue;
  rank?: RawValue;
}): BuildQuery {
  const role = first(raw.role);
  const period = first(raw.period);
  const queue = first(raw.queue);
  const rank = first(raw.rank);
  return {
    role:
      role && Object.keys(ROLE_LABELS).includes(role)
        ? (role as Role)
        : undefined,
    period: PERIOD_OPTIONS.some((o) => o.value === period)
      ? (period as Period)
      : DEFAULT_PERIOD,
    queue: QUEUE_OPTIONS.some((o) => o.value === queue)
      ? (queue as QueueFilter)
      : DEFAULT_QUEUE,
    rank: RANK_OPTIONS.some((o) => o.value === rank)
      ? (rank as RankFilter)
      : DEFAULT_RANK,
  };
}

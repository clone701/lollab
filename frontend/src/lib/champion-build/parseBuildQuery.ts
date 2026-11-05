import type {
  BuildQuery,
  Period,
  QueueFilter,
  Role,
} from '@/types/championBuild';
import {
  DEFAULT_PERIOD,
  DEFAULT_QUEUE,
  PERIOD_OPTIONS,
  QUEUE_OPTIONS,
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
}): BuildQuery {
  const role = first(raw.role);
  const period = first(raw.period);
  const queue = first(raw.queue);
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
  };
}

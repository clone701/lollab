import type { Role } from '@/types/championBuild';

const ROLES: string[] = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'];

/** team_position をビルドページのロールにする。空や未知の値は undefined */
export function toRole(teamPosition: string): Role | undefined {
  return ROLES.includes(teamPosition) ? (teamPosition as Role) : undefined;
}

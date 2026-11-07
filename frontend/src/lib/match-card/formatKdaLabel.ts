import { formatKdaRatio } from '@/lib/match-detail';

/** KDA の比率の表示（例: 4.33:1 KDA）。デスが0なら Perfect */
export function formatKdaLabel(
  kills: number,
  deaths: number,
  assists: number
): string {
  const ratio = formatKdaRatio(kills, deaths, assists);
  return ratio === 'Perfect' ? ratio : `${ratio} KDA`;
}

import {
  ChampionBuildContent,
  ChampionBuildMessage,
} from '@/components/champion-build';
import { parseBuildQuery } from '@/lib/champion-build';
import { getChampionById } from '@/lib/utils/championHelpers';

interface ChampionBuildPageProps {
  params: Promise<{ championName: string }>;
  searchParams: Promise<{
    role?: string | string[];
    period?: string | string[];
    queue?: string | string[];
  }>;
}

// Next.js 16 では params・searchParams は Promise
export default async function ChampionBuildPage({
  params,
  searchParams,
}: ChampionBuildPageProps) {
  const { championName } = await params;
  const champion = getChampionById(championName);
  if (!champion) {
    return <ChampionBuildMessage text="チャンピオンが見つかりません" />;
  }
  const query = parseBuildQuery(await searchParams);
  return <ChampionBuildContent champion={champion} query={query} />;
}

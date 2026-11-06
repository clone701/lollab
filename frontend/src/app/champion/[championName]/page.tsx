import { Suspense } from 'react';
import {
  ChampionBuildFromUrl,
  ChampionBuildMessage,
} from '@/components/champion-build';
import { champions } from '@/lib/data/champions';
import { getChampionById } from '@/lib/utils/championHelpers';

interface ChampionBuildPageProps {
  params: Promise<{ championName: string }>;
}

// 静的書き出しのため、全チャンピオンのページをビルド時に生成する
export function generateStaticParams(): { championName: string }[] {
  return champions.map((champion) => ({ championName: champion.id }));
}

// 一覧にないチャンピオン名は 404（not-found）にする
export const dynamicParams = false;

// Next.js 16 では params は Promise
export default async function ChampionBuildPage({
  params,
}: ChampionBuildPageProps) {
  const { championName } = await params;
  const champion = getChampionById(championName);
  if (!champion) {
    return <ChampionBuildMessage text="チャンピオンが見つかりません" />;
  }
  // useSearchParams を使う子は静的書き出しのため Suspense で囲む
  return (
    <Suspense
      fallback={<p className="py-8 text-center text-fg-muted">読み込み中...</p>}
    >
      <ChampionBuildFromUrl champion={champion} />
    </Suspense>
  );
}

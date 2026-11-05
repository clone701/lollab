import { ChampionSearchGrid } from '@/components/champion-build';

export default function ChampionPage() {
  return (
    <div className="flex flex-col gap-4 py-6">
      <h1 className="text-xl font-bold text-gray-800">チャンピオン</h1>
      <ChampionSearchGrid />
    </div>
  );
}

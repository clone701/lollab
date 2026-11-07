import type { MatchData } from '@/types/summoner';
import { MatchChampionIcon } from './MatchChampionIcon';
import { MatchItems } from './MatchItems';
import { MatchSpellRune } from './MatchSpellRune';

interface MatchBuildProps {
  match: Pick<
    MatchData,
    'championName' | 'spellIds' | 'keystoneId' | 'subStyleId' | 'itemIds'
  >;
}

// チャンピオン: アイコンとその右のスペル・ルーン。その下に最終アイテム
export function MatchBuild({ match }: MatchBuildProps) {
  return (
    <div className="flex flex-shrink-0 flex-col gap-1">
      <div className="flex items-center gap-1">
        <MatchChampionIcon championName={match.championName} />
        <MatchSpellRune
          spellIds={match.spellIds}
          keystoneId={match.keystoneId}
          subStyleId={match.subStyleId}
        />
      </div>
      <MatchItems itemIds={match.itemIds} />
    </div>
  );
}

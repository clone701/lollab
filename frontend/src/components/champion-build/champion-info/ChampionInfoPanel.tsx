'use client';

import { useId, useState } from 'react';
import type { ChampionDetail } from '@/components/game-data';
import { toStatRows } from '@/lib/champion-info';
import { SkillList } from './SkillList';
import { StatTable } from './StatTable';
import { TraitBars } from './TraitBars';

interface ChampionInfoPanelProps {
  /** useChampionDetail の結果。読み込み前・失敗時（champion が null）は何も出さない */
  detail: ChampionDetail;
}

// 基礎情報のカード: 特性・ステータス・スキル。右上のボタンで開閉する（最初は開く）
export function ChampionInfoPanel({ detail }: ChampionInfoPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const contentId = useId();
  const { champion, skills } = detail;
  if (!champion) return null;
  return (
    <section className="rounded-lg border border-line bg-surface p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-fg">基礎情報</h2>
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={contentId}
          onClick={() => setIsOpen((open) => !open)}
          className="rounded px-2 py-1 text-sm text-fg-muted transition-colors duration-150 hover:bg-surface-2 hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {isOpen ? '閉じる' : '開く'}
        </button>
      </div>
      {isOpen && (
        <div id={contentId} className="mt-3 flex flex-col gap-4">
          <TraitBars info={champion.info} />
          <StatTable rows={toStatRows(champion.stats, champion.partype)} />
          {skills && <SkillList skills={skills} />}
        </div>
      )}
    </section>
  );
}

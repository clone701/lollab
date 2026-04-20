'use client';

import FavoriteChampions from '../FavoriteChampions';
import { ChampionPickButton } from './ChampionPickButton';
import { ChampionList } from './ChampionList';
import { useChampionSelector } from './useChampionSelector';

type SidebarViewProps = ReturnType<typeof useChampionSelector> & {
  myChampionId: string | null;
  enemyChampionId: string | null;
  onMyChampionChange: (id: string | null) => void;
  onEnemyChampionChange: (id: string | null) => void;
};

export function ChampionSelectorSidebarView({
  myChampionId,
  enemyChampionId,
  onMyChampionChange,
  onEnemyChampionChange,
  searchQuery,
  selectionMode,
  recentChampions,
  myChampion,
  enemyChampion,
  filteredChampions,
  handleSearchChange,
  handleChampionSelect,
  handleReset,
  setSelectionMode,
}: SidebarViewProps) {
  const bothSelected = !!(myChampionId && enemyChampionId);
  return (
    <aside className="w-80 h-screen overflow-y-auto bg-white border-r border-gray-200">
      <div className="p-4">
        <section className="mb-4">
          <ChampionPickButton
            champion={myChampion}
            isActive={selectionMode === 'my'}
            label="自分"
            activeColor="blue"
            onClick={() => {
              if (myChampionId) {
                onMyChampionChange(null);
              }
              setSelectionMode('my');
            }}
          />
        </section>
        <section className="mb-4">
          <ChampionPickButton
            champion={enemyChampion}
            isActive={selectionMode === 'enemy'}
            label="相手"
            activeColor="red"
            onClick={() => {
              if (enemyChampionId) {
                onEnemyChampionChange(null);
              }
              setSelectionMode('enemy');
            }}
          />
        </section>
        {bothSelected && (
          <section className="mb-4">
            <button
              onClick={handleReset}
              className="w-full py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              リセット
            </button>
          </section>
        )}
        {!bothSelected && (
          <section className="mb-4">
            <input
              type="text"
              placeholder="チャンピオン名で検索..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </section>
        )}
        {!bothSelected && recentChampions.length > 0 && (
          <section className="mb-4">
            <h2 className="text-sm font-semibold text-gray-800 mb-2">
              よく使うチャンピオン
            </h2>
            <FavoriteChampions
              champions={recentChampions}
              selectedId={
                selectionMode === 'my' ? myChampionId : enemyChampionId
              }
              onSelect={handleChampionSelect}
            />
          </section>
        )}
        {!bothSelected && (
          <section className="mb-4">
            <h2 className="text-sm font-semibold text-gray-800 mb-2">
              チャンピオン一覧
            </h2>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              <ChampionList
                champions={filteredChampions}
                myChampionId={myChampionId}
                enemyChampionId={enemyChampionId}
                selectionMode={selectionMode}
                onSelect={handleChampionSelect}
              />
            </div>
          </section>
        )}
      </div>
    </aside>
  );
}

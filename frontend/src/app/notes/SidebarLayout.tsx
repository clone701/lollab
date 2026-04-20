'use client';

import ChampionSelectorSidebar from '@/components/notes/ChampionSelectorSidebar';

interface SidebarLayoutProps {
  myChampionId: string | null;
  enemyChampionId: string | null;
  sidebarOpen: boolean;
  onMyChampionChange: (id: string | null) => void;
  onEnemyChampionChange: (id: string | null) => void;
  onReset: () => void;
  onCloseSidebar: () => void;
}

export function SidebarLayout({
  myChampionId,
  enemyChampionId,
  sidebarOpen,
  onMyChampionChange,
  onEnemyChampionChange,
  onReset,
  onCloseSidebar,
}: SidebarLayoutProps) {
  const sidebarProps = {
    myChampionId,
    enemyChampionId,
    onMyChampionChange,
    onEnemyChampionChange,
    onReset,
  };
  return (
    <>
      <div className="hidden md:block">
        <ChampionSelectorSidebar {...sidebarProps} />
      </div>
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            className="absolute inset-0 bg-black/50 cursor-default"
            onClick={onCloseSidebar}
            aria-label="サイドバーを閉じる"
          />
          <div className="absolute left-0 top-0 bottom-0 w-80 bg-white">
            <ChampionSelectorSidebar {...sidebarProps} />
          </div>
        </div>
      )}
    </>
  );
}

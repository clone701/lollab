// タブメニューコンポーネント（総合/チャンピオン/現在の対戦）
export type TabType = 'overview' | 'champions' | 'live-game';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const TABS: { key: TabType; label: string }[] = [
  { key: 'overview', label: '総合' },
  { key: 'champions', label: 'チャンピオン' },
  { key: 'live-game', label: '現在の対戦' },
];

export default function TabNavigation({
  activeTab,
  onTabChange,
}: TabNavigationProps) {
  return (
    <nav className="border-b border-gray-200">
      <ul className="flex gap-0" role="tablist">
        {TABS.map(({ key, label }) => (
          <li key={key} role="presentation">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === key}
              onClick={() => onTabChange(key)}
              className={`px-6 py-3 text-sm font-medium transition-colors duration-150 border-b-2 ${
                activeTab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              } focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
            >
              {label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

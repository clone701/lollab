'use client';

interface ChampionSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  /** 表示時に入力欄へフォーカスする */
  autoFocus?: boolean;
}

// チャンピオン名（日本語・読み・英語）の検索欄
export function ChampionSearchInput({
  value,
  onChange,
  label,
  autoFocus = false,
}: ChampionSearchInputProps) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      placeholder="名前で検索（日本語・読み・英語）"
      autoFocus={autoFocus}
      className="w-full rounded border border-line bg-surface-2 px-3 py-2 text-sm text-fg placeholder:text-fg-subtle hover:border-line-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    />
  );
}

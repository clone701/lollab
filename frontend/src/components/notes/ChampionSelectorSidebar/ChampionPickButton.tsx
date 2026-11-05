'use client';

interface Champion {
  id: string;
  name: string;
  imagePath: string;
}

interface ChampionPickButtonProps {
  champion: Champion | null;
  isActive: boolean;
  label: string;
  activeColor: 'blue' | 'red';
  onClick: () => void;
}

export function ChampionPickButton({
  champion,
  isActive,
  label,
  activeColor,
  onClick,
}: ChampionPickButtonProps) {
  const active =
    activeColor === 'blue'
      ? 'bg-accent/15 border-2 border-accent'
      : 'bg-danger/15 border-2 border-danger';
  const inactive =
    activeColor === 'blue'
      ? 'bg-accent/5 border border-accent/30 hover:bg-accent/15'
      : 'bg-danger/5 border border-danger/30 hover:bg-danger/15';
  return (
    <button
      onClick={onClick}
      className={`w-full p-3 rounded-lg transition-colors ${isActive ? active : inactive}`}
    >
      {champion ? (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={champion.imagePath}
            alt={champion.name}
            className="w-12 h-12 rounded-full"
            width={48}
            height={48}
          />
          <div className="flex flex-col items-start">
            <span className="text-xs text-fg-muted">{label}</span>
            <span className="text-base font-semibold text-fg">
              {champion.name}
            </span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-fg-subtle">{label}のチャンピオンを選択</p>
      )}
    </button>
  );
}

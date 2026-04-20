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
      ? 'bg-blue-100 border-2 border-blue-400'
      : 'bg-red-100 border-2 border-red-400';
  const inactive =
    activeColor === 'blue'
      ? 'bg-blue-50 border border-blue-200 hover:bg-blue-100'
      : 'bg-red-50 border border-red-200 hover:bg-red-100';
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
            <span className="text-xs text-gray-500">{label}</span>
            <span className="text-base font-semibold text-gray-800">
              {champion.name}
            </span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-400">{label}のチャンピオンを選択</p>
      )}
    </button>
  );
}

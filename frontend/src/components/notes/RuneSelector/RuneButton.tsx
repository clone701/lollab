'use client';

interface RuneButtonProps {
  id: number;
  icon: string;
  name: string;
  selected: boolean;
  disabled: boolean;
  size?: 'sm' | 'md';
  ariaLabel: string;
  onClick: () => void;
}

export function RuneButton({
  icon,
  name,
  selected,
  disabled,
  size = 'md',
  ariaLabel,
  onClick,
}: RuneButtonProps) {
  const imgSize = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const imgPx = size === 'sm' ? 32 : 40;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-1 rounded-lg transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        selected
          ? 'ring-2 ring-blue-500 shadow-md shadow-blue-500/20 bg-blue-50'
          : disabled
            ? 'opacity-50 cursor-not-allowed bg-white'
            : 'hover:ring-2 hover:ring-gray-300 bg-white'
      }`}
      aria-label={ariaLabel}
      aria-pressed={selected}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={icon}
        alt={name}
        className={imgSize}
        width={imgPx}
        height={imgPx}
        loading="lazy"
      />
    </button>
  );
}

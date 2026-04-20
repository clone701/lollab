'use client';

interface ToolbarButton {
  label: string;
  title: string;
  onClick: () => void;
}

interface MarkdownToolbarProps {
  onBold: () => void;
  onItalic: () => void;
  onHeading: () => void;
  onBulletList: () => void;
  onNumberedList: () => void;
}

export function MarkdownToolbar({
  onBold,
  onItalic,
  onHeading,
  onBulletList,
  onNumberedList,
}: MarkdownToolbarProps) {
  const buttons: ToolbarButton[] = [
    { label: 'B', title: '太字 (** **)', onClick: onBold },
    { label: 'I', title: '斜体 (* *)', onClick: onItalic },
    { label: 'H2', title: '見出し (##)', onClick: onHeading },
    { label: '•', title: '箇条書き (- )', onClick: onBulletList },
    { label: '1.', title: '番号リスト (1. )', onClick: onNumberedList },
  ];

  return (
    <div className="flex gap-1 px-2 py-1.5 border border-gray-200 border-b-0 rounded-t bg-gray-50">
      {buttons.map((btn) => (
        <button
          key={btn.label}
          type="button"
          title={btn.title}
          onClick={btn.onClick}
          className="px-3 py-1.5 text-sm font-medium text-gray-600 rounded hover:bg-gray-200 transition-colors duration-150 min-w-[36px]"
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}

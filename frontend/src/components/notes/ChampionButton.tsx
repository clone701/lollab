/**
 * ChampionButtonコンポーネント
 *
 * 個別チャンピオンの選択ボタン
 * 要件: 3.4, 5.5, 14.4
 */

'use client';

import React from 'react';
import { Champion } from '@/types/champion';

interface ChampionButtonProps {
  /** チャンピオン情報 */
  champion: Champion;
  /** 選択状態 */
  selected: boolean;
  /** クリックハンドラー */
  onClick: () => void;
}

/**
 * チャンピオン選択ボタン
 *
 * チャンピオン画像と名前を表示し、選択状態を黒色でハイライト表示する
 * React.memoでメモ化してパフォーマンスを最適化
 */
const ChampionButton: React.FC<ChampionButtonProps> = React.memo(
  ({ champion, selected, onClick }) => {
    return (
      <button
        onClick={onClick}
        className={`
        flex items-center gap-2 p-1.5 rounded w-full
        transition-colors duration-150
        ${selected ? 'bg-gray-100 border-2 border-black' : 'hover:bg-gray-50'}
      `}
        aria-label={`${champion.name}を選択`}
        aria-pressed={selected}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={champion.imagePath}
          alt={champion.name}
          className="w-8 h-8 rounded-full"
          loading="lazy"
          width={32}
          height={32}
        />
        <div className="flex items-center justify-between flex-1 min-w-0">
          <span className="text-xs">{champion.name}</span>
          <span className="text-xs text-gray-400 ml-2">{champion.id}</span>
        </div>
      </button>
    );
  }
);

ChampionButton.displayName = 'ChampionButton';

export default ChampionButton;

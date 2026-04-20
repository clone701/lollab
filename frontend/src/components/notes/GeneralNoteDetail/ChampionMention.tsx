'use client';

/**
 * ChampionMention コンポーネント
 *
 * テキスト中の `/championId` パターンをチャンピオン画像+名前に変換する
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import Image from 'next/image';
import { getChampionById } from '@/lib/utils/championHelpers';
import { champions } from '@/lib/data/champions';

interface ChampionMentionProps {
  content: string;
}

// チャンピオンIDを長い順にソート（長いIDを優先マッチ）
const sortedChampionIds = champions
  .map((c) => c.id)
  .sort((a, b) => b.length - a.length);

export function ChampionMention({ content }: ChampionMentionProps) {
  const parts = content.split('/');

  return (
    <span>
      {parts.map((part, index) => {
        // 最初のセグメントはプレーンテキスト
        if (index === 0) {
          return <span key={index}>{part}</span>;
        }

        // 大文字小文字を無視してチャンピオンIDをマッチ
        const partLower = part.toLowerCase();
        const matchedId = sortedChampionIds.find((id) => {
          if (!partLower.startsWith(id.toLowerCase())) return false;
          const nextChar = part[id.length];
          return nextChar === undefined || !/[A-Za-z0-9]/.test(nextChar);
        });

        if (matchedId) {
          const champion = getChampionById(matchedId);
          const rest = part.slice(matchedId.length);
          if (champion) {
            return (
              <span key={index}>
                <Image
                  src={champion.imagePath}
                  alt={champion.name}
                  width={24}
                  height={24}
                  className="inline rounded-full"
                />
                <span>{champion.name}</span>
                <span>{rest}</span>
              </span>
            );
          }
        }

        // 無効なIDはテキストのまま表示
        return <span key={index}>/{part}</span>;
      })}
    </span>
  );
}

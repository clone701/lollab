'use client';

import { getRecent } from '@/lib/storage';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RecentChips() {
  const [items, setItems] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => setItems(getRecent()), []);

  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="text-lg font-medium text-gray-900">最近検索</div>
      <div className="flex flex-wrap gap-3">
        {items.map((q) => (
          <button
            key={q}
            onClick={() => router.push(`/search?query=${encodeURIComponent(q)}`)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-gray-800 hover:bg-gray-100 transition"
            aria-label={`検索 ${q}`}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

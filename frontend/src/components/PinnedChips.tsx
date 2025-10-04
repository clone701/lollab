'use client';

import { ensureInitialPins, getPins } from "@/lib/storage";
import { useEffect, useState } from 'react';

export default function PinnedChips() {
  const [pins, setPins] = useState<string[]>([]);

  useEffect(() => {
    ensureInitialPins();
    setPins(getPins());
  }, []);

  if (pins.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="text-lg font-medium">ピン留め</div>
      <div className="flex flex-wrap gap-3">
        {pins.map((name) => (
          <button
            key={name}
            className="rounded-lg border px-4 py-2 text-gray-800 hover:bg-gray-50"
            aria-label={`ピン留め ${name}`}
            // クリック時の遷移先は将来のチャンピオン詳細ページに合わせて変更
            onClick={() => alert(`${name} のページへ（実装予定）`)}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}
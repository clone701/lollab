'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { addRecent } from '@/lib/storage';

export default function SearchBar() {
  const [q, setQ] = useState('');
  const router = useRouter();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    addRecent(query);
    // 例：検索結果ページに飛ばす（未実装でもOK）
    router.push(`/search?query=${encodeURIComponent(query)}`);
  };

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-2xl gap-2">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="サモナー名 / チャンピオンを検索…"
        className="h-11 w-full rounded-lg border px-4 text-[15px] outline-none focus:border-gray-400"
        aria-label="検索テキスト"
      />
      <button
        type="submit"
        className="h-11 rounded-lg bg-gray-700 px-4 text-white hover:bg-gray-800"
      >
        検索
      </button>
    </form>
  );
}
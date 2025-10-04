'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { label: 'ノート一覧', href: '/notes' },
  { label: '新規ノート作成', href: '/notes/new' },
  { label: 'チャンピオン対策', href: '/notes/counter' },
];

export default function NotesTabBar() {
  const pathname = usePathname();
  return (
    <nav className="flex border-b border-[var(--border)] mb-8">
      {tabs.map(tab => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`px-6 py-3 -mb-px border-b-2 text-sm font-medium transition
            ${pathname === tab.href
              ? 'border-[var(--foreground)] text-[var(--foreground)] bg-white'
              : 'border-transparent text-gray-400 hover:text-[var(--foreground)]'}
          `}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
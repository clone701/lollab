'use client';

import { useState, useRef, useEffect } from 'react';
import type { Region } from '@/types/summoner';

const REGIONS: Region[] = ['JP', 'KR', 'NA', 'EUW', 'EUNE', 'OCE'];

interface RegionSelectorProps {
  value: Region;
  onChange: (region: Region) => void;
}

export default function RegionSelector({
  value,
  onChange,
}: RegionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // フォーカスアウトで閉じる
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(region: Region) {
    onChange(region);
    setIsOpen(false);
  }

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex items-center gap-1 px-3 py-3 text-sm font-bold text-fg-muted bg-surface-2 hover:bg-line rounded-l-full transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {value}
        <span className="text-xs" aria-hidden="true">
          ▼
        </span>
      </button>

      {isOpen && (
        <ul
          role="listbox"
          aria-label="地域を選択"
          className="absolute left-0 top-full mt-1 z-50 bg-surface border border-line rounded-lg shadow-md overflow-hidden min-w-[80px]"
        >
          {REGIONS.map((region) => (
            <li key={region} role="option" aria-selected={region === value}>
              <button
                type="button"
                onClick={() => handleSelect(region)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors duration-150 hover:bg-surface-2 focus:outline-none focus-visible:bg-surface-2 ${
                  region === value ? 'font-bold text-accent' : 'text-fg-muted'
                }`}
              >
                {region}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

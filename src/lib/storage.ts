'use client';

const RECENT_KEY = 'lollab_recent_v1';
const PINS_KEY = 'lollab_pins_v1';

export function getRecent(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') as string[];
  } catch {
    return [];
  }
}

export function addRecent(q: string, limit = 6) {
  if (!q) return;
  const list = [q, ...getRecent().filter(v => v !== q)].slice(0, limit);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list));
}

export function getPins(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(PINS_KEY) || '[]') as string[];
  } catch {
    return [];
  }
}

/** 初期ピン（未設定なら一度だけセット） */
export function ensureInitialPins() {
  if (typeof window === 'undefined') return;
  const existing = localStorage.getItem(PINS_KEY);
  if (!existing) {
    const initial = ['アーリ', 'ガレン', 'エズリアル'];
    localStorage.setItem(PINS_KEY, JSON.stringify(initial));
  }
}

export function togglePin(name: string) {
  const pins = getPins();
  const next = pins.includes(name) ? pins.filter(p => p !== name) : [name, ...pins];
  localStorage.setItem(PINS_KEY, JSON.stringify(next));
  return next;
}

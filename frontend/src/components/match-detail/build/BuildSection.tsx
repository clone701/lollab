import type { ReactNode } from 'react';

interface BuildSectionProps {
  title: string;
  children: ReactNode;
}

export function BuildSection({ title, children }: BuildSectionProps) {
  return (
    <section className="flex flex-col gap-2 rounded-lg bg-surface-2 p-3">
      <h4 className="text-sm font-semibold text-fg-muted">{title}</h4>
      {children}
    </section>
  );
}

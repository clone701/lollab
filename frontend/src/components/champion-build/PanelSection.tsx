interface PanelSectionProps {
  title: string;
  children: React.ReactNode;
}

export function PanelSection({ title, children }: PanelSectionProps) {
  return (
    <section className="rounded-lg border border-line bg-surface p-4 shadow-sm">
      <h2 className="mb-3 text-base font-semibold text-fg">{title}</h2>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

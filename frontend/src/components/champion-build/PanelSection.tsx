interface PanelSectionProps {
  title: string;
  children: React.ReactNode;
}

export function PanelSection({ title, children }: PanelSectionProps) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-base font-semibold text-gray-800">{title}</h2>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

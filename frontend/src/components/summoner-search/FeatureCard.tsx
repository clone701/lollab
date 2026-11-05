import type { ReactNode } from 'react';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export default function FeatureCard({
  icon,
  title,
  description,
}: FeatureCardProps) {
  return (
    <div className="flex-1 flex flex-col items-center gap-2 p-4 bg-surface border border-line rounded-lg text-center">
      <span className="text-2xl" aria-hidden="true">
        {icon}
      </span>
      <p className="text-sm font-semibold text-fg">{title}</p>
      <p className="text-xs text-fg-muted">{description}</p>
    </div>
  );
}

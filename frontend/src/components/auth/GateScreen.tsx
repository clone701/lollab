interface GateScreenProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
}

// ログイン・利用不可・読み込み中の表示に共通する、画面中央のパネル
export function GateScreen({ title, description, children }: GateScreenProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-4">
      <section className="flex w-full max-w-sm flex-col items-center gap-4 rounded-lg border border-line bg-surface p-4 text-center">
        {title && <h1 className="text-xl font-bold text-fg">{title}</h1>}
        {description && <p className="text-sm text-fg-muted">{description}</p>}
        {children}
      </section>
    </div>
  );
}

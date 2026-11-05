interface ChampionBuildMessageProps {
  text: string;
}

export function ChampionBuildMessage({ text }: ChampionBuildMessageProps) {
  return (
    <p role="alert" className="py-8 text-center text-fg-muted">
      {text}
    </p>
  );
}

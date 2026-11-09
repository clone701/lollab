interface SkillStatProps {
  label: string;
  value: string;
}

// スキルの CD・コスト・射程の1項目。ラベルは控えめ、値は本文の色
export function SkillStat({ label, value }: SkillStatProps) {
  return (
    <div className="flex gap-1">
      <dt className="text-fg-muted">{label}</dt>
      <dd className="text-fg">{value}</dd>
    </div>
  );
}

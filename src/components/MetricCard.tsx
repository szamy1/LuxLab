interface MetricCardProps {
  label: string;
  value: string;
  hint?: string;
}

export function MetricCard({ label, value, hint }: MetricCardProps) {
  return (
    <div data-card className="p-4">
      <div className="text-sm text-text-muted">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
      {hint ? <div className="text-xs text-text-muted mt-1">{hint}</div> : null}
    </div>
  );
}

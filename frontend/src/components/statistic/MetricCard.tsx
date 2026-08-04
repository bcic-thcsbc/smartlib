import { ChevronRight } from "lucide-react";

export function MetricCard({
  label,
  value,
  detail,
  onClick,
}: {
  label: string;
  value: number;
  detail?: string;
  onClick?: () => void;
}) {
  return (
    <button className="metric metric-link" onClick={onClick} type="button">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
      <ChevronRight size={17} className="metric-arrow" aria-hidden="true" />
    </button>
  );
}

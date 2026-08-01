import { ChevronRight } from "lucide-react";
export function MetricCard({
  label,
  value,
  icon: Icon,
  color,
  onClick,
}: {
  label: string;
  value: number;
  icon: any;
  color: string;
  onClick?: () => void;
}) {
  return (
    <button className="metric metric-link" onClick={onClick} type="button">
      <div className={`metric-icon ${color}`}>
        <Icon size={18} />
      </div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <ChevronRight size={17} className="metric-arrow" />
    </button>
  );
}

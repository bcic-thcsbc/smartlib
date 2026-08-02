import { BookOpen } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <BookOpen size={22} aria-hidden="true" />
      <strong>{title}</strong>
      <span>{text}</span>
      {action && <div className="empty-action">{action}</div>}
    </div>
  );
}

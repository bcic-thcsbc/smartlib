import { BookOpen } from "lucide-react";
export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty">
      <BookOpen size={22} />
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}

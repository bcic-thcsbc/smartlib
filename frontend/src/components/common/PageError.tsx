import { RotateCcw } from "lucide-react";

export function PageError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="page-error" role="alert">
      <p>{message}</p>
      {onRetry && <button className="secondary" type="button" onClick={onRetry}><RotateCcw size={16} aria-hidden="true" />Thử lại</button>}
    </div>
  );
}

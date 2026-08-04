import { Plus, Search } from "lucide-react";
import type { ReactNode } from "react";
import { FloatingInput } from "./FloatingInput";

export function Toolbar({
  title,
  eyebrow,
  description,
  count,
  search,
  onSearch,
  action,
  onAction,
  filters,
  actions,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  count?: number;
  search?: string;
  onSearch?: (value: string) => void;
  action?: string;
  onAction?: () => void;
  filters?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="toolbar page-header">
      <div className="toolbar-copy">
        {eyebrow && <p className="toolbar-context">{eyebrow}</p>}
        <h1>
          {title}
          {count !== undefined && <span className="count">{count}</span>}
        </h1>
        {description && <p className="toolbar-description">{description}</p>}
      </div>
      <div className="toolbar-actions">
        {onSearch && (
          <FloatingInput
            label="Tìm tựa sách"
            icon={<Search size={18} aria-hidden="true" />}
            wrapperClassName="search"
            value={search || ""}
            onChange={(event) => onSearch(event.target.value)}
            aria-label="Tìm kiếm"
          />
        )}
        {filters && <div className="toolbar-filters">{filters}</div>}
        {actions}
        {action && (
          <button className="primary" onClick={onAction} type="button">
            <Plus size={17} aria-hidden="true" />
            {action}
          </button>
        )}
      </div>
    </header>
  );
}

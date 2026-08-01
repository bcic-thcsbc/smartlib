import { Plus, Search } from "lucide-react";
import type { ReactNode } from "react";
export function Toolbar({
  title,
  count,
  search,
  onSearch,
  action,
  onAction,
  filters,
}: {
  title: string;
  count?: number;
  search?: string;
  onSearch?: (value: string) => void;
  action?: string;
  onAction?: () => void;
  filters?: ReactNode;
}) {
  return (
    <div className="toolbar">
      <div>
        <p className="eyebrow">Không gian quản lý</p>
        <h2>
          {title}
          {count !== undefined && <span className="count">{count}</span>}
        </h2>
      </div>
      <div className="toolbar-actions">
        {onSearch && (
          <div className="search">
            <Search size={17} />
            <input
              placeholder="Tìm theo tên, tiêu đề hoặc mã sách"
              value={search || ""}
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
        )}
        {filters && <div className="toolbar-filters">{filters}</div>}
        {action && (
          <button className="primary" onClick={onAction}>
            <Plus size={17} />
            {action}
          </button>
        )}
      </div>
    </div>
  );
}

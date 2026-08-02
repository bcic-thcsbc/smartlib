import { MoreHorizontal, type LucideIcon } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

type RowAction = {
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  tone?: "danger";
  disabled?: boolean;
};

type RowActionMenuProps = {
  actions: RowAction[];
  label?: string;
};

export function RowActionMenu({
  actions,
  label = "Thao tác",
}: RowActionMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="row-action-menu" ref={menuRef}>
      <button
        className="icon-button"
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={menuId}
        title={label}
        onClick={() => setOpen((value) => !value)}
      >
        <MoreHorizontal size={18} aria-hidden="true" />
      </button>
      {open && (
        <div className="row-action-popover" id={menuId} role="menu">
          {actions.map(({ label: actionLabel, icon: Icon, onSelect, tone, disabled }) => (
            <button
              key={actionLabel}
              className={tone === "danger" ? "row-action-option danger-text" : "row-action-option"}
              type="button"
              role="menuitem"
              disabled={disabled}
              onClick={() => {
                setOpen(false);
                onSelect();
              }}
            >
              <Icon size={16} aria-hidden="true" />
              {actionLabel}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

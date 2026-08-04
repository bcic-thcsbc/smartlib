import { MoreHorizontal, type LucideIcon } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

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
  const [position, setPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !menuRef.current?.contains(target) &&
        !popoverRef.current?.contains(target)
      ) {
        setOpen(false);
      }
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

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      const trigger = triggerRef.current;
      const popover = popoverRef.current;
      if (!trigger || !popover) return;

      const triggerRect = trigger.getBoundingClientRect();
      const popoverWidth = popover.offsetWidth;
      const popoverHeight = popover.offsetHeight;
      const gap = 4;
      const viewportPadding = 8;
      const canOpenAbove =
        triggerRect.top - gap - popoverHeight >= viewportPadding;
      const top = canOpenAbove
        ? triggerRect.top - gap - popoverHeight
        : triggerRect.bottom + gap;
      const left = Math.min(
        Math.max(viewportPadding, triggerRect.right - popoverWidth),
        window.innerWidth - popoverWidth - viewportPadding,
      );

      setPosition({ top, left });
    };

    updatePosition();
    const frame = requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [actions.length, open]);

  return (
    <div className="row-action-menu" ref={menuRef}>
      <button
        ref={triggerRef}
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
      {open &&
        createPortal(
          <div
            ref={popoverRef}
            className="row-action-popover"
            id={menuId}
            role="menu"
            style={
              position
                ? { left: position.left, top: position.top }
                : { visibility: "hidden" }
            }
          >
            {actions.map(
              ({
                label: actionLabel,
                icon: Icon,
                onSelect,
                tone,
                disabled,
              }) => (
                <button
                  key={actionLabel}
                  className={
                    tone === "danger"
                      ? "row-action-option danger-text"
                      : "row-action-option"
                  }
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
              ),
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}

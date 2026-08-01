import { ChevronDown, Search } from "lucide-react";
import {
  Children,
  isValidElement,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

type SelectorEvent = { target: { value: string } };

type SelectorProps = {
  value?: string | number;
  onChange?: (event: SelectorEvent) => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  "aria-label"?: string;
};

type Option = {
  value: string;
  label: ReactNode;
  disabled: boolean;
};

function optionsFromChildren(children: ReactNode): Option[] {
  return Children.toArray(children).flatMap((child) => {
    if (
      !isValidElement<{
        value?: string | number;
        disabled?: boolean;
        children?: ReactNode;
      }>(child)
    ) {
      return [];
    }

    return [
      {
        value: String(child.props.value ?? ""),
        label: child.props.children,
        disabled: Boolean(child.props.disabled),
      },
    ];
  });
}

export function Selector({
  value = "",
  onChange,
  children,
  className = "",
  disabled = false,
  searchable = false,
  searchPlaceholder = "Tìm trong danh sách",
  "aria-label": ariaLabel,
}: SelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selectorId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const options = useMemo(() => optionsFromChildren(children), [children]);
  const selected = options.find((option) => option.value === String(value));
  const visibleOptions = options.filter((option) => {
    if (!query.trim()) return true;
    return String(option.label)
      .toLocaleLowerCase()
      .includes(query.toLocaleLowerCase());
  });

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const close = (returnFocus = false) => {
    setOpen(false);
    if (returnFocus) requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const choose = (option: Option) => {
    if (option.disabled) return;
    onChange?.({ target: { value: option.value } });
    close(true);
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
    }
  };

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>(
        '[role="option"]:not([disabled])',
      ),
    );
    const active = document.activeElement as HTMLButtonElement | null;
    const index = items.indexOf(active as HTMLButtonElement);

    if (event.key === "Escape") {
      event.preventDefault();
      close(true);
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      const next =
        items[(index + direction + items.length) % items.length] ?? items[0];
      next?.focus();
    }
  };

  return (
    <div className={`selector ${open ? "is-open" : ""} ${className}`}>
      <button
        ref={triggerRef}
        className="selector-trigger"
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={selectorId}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className={selected ? "" : "selector-placeholder"}>
          {selected?.label ?? "Chọn một mục"}
        </span>
        <ChevronDown size={17} aria-hidden="true" />
      </button>

      {open && (
        <>
          <button
            className="selector-backdrop"
            type="button"
            tabIndex={-1}
            aria-label="Đóng danh sách"
            onClick={() => close()}
          />
          <div
            id={selectorId}
            className="selector-menu"
            role="listbox"
            onKeyDown={handleMenuKeyDown}
          >
            {searchable && (
              <label className="selector-search">
                <Search size={15} aria-hidden="true" />
                <input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={searchPlaceholder}
                  aria-label={searchPlaceholder}
                />
              </label>
            )}
            <div className="selector-options">
              {visibleOptions.length ? (
                visibleOptions.map((option) => (
                  <button
                    key={option.value || "__empty"}
                    className={option.value === String(value) ? "selected" : ""}
                    type="button"
                    role="option"
                    aria-selected={option.value === String(value)}
                    disabled={option.disabled}
                    onClick={() => choose(option)}
                  >
                    {option.label}
                  </button>
                ))
              ) : (
                <p className="selector-empty">
                  Không tìm thấy lựa chọn phù hợp.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

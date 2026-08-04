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
  searchText: string;
  disabled: boolean;
};

function textFromNode(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textFromNode).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return textFromNode(node.props.children);
  }
  return "";
}

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
        searchText: textFromNode(child.props.children),
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
  searchable: _searchable = true,
  searchPlaceholder = "Tìm hoặc chọn mục",
  "aria-label": ariaLabel,
}: SelectorProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const selectorId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const options = useMemo(() => optionsFromChildren(children), [children]);
  const selected = options.find((option) => option.value === String(value));
  const visibleOptions = options.filter((option) =>
    option.searchText.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  );

  useEffect(() => {
    const list = listRef.current;
    const item = list?.children[index] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [index, visibleOptions]);

  const close = (returnFocus = false) => {
    setOpen(false);
    if (returnFocus) requestAnimationFrame(() => inputRef.current?.focus());
  };

  const choose = (option: Option) => {
    if (option.disabled) return;
    onChange?.({ target: { value: option.value } });
    setQuery("");
    close(true);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        setIndex(0);
        setOpen(true);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIndex((current) => Math.min(current + 1, visibleOptions.length - 1));
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIndex((current) => Math.max(current - 1, 0));
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const option = visibleOptions[index];
      if (option) choose(option);
    }

    if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  };

  return (
    <div className={`selector ${open ? "is-open" : ""} ${className}`}>
      <input
        ref={inputRef}
        className="selector-trigger"
        value={selected ? selected.searchText : query}
        placeholder={searchPlaceholder}
        spellCheck={false}
        aria-label={ariaLabel ?? searchPlaceholder}
        aria-autocomplete="list"
        aria-controls={selectorId}
        aria-expanded={open}
        role="combobox"
        disabled={disabled}
        onClick={(event) => {
          setIndex(0);
          setOpen(true);
          event.currentTarget.scrollIntoView({ block: "center", behavior: "smooth" });
        }}
        onKeyDown={handleKeyDown}
        onChange={(event) => {
          setQuery(event.target.value);
          setIndex(0);
          onChange?.({ target: { value: "" } });
          setOpen(true);
        }}
      />

      {open && (
        <>
          <button
            className="selector-backdrop"
            type="button"
            tabIndex={-1}
            aria-label="Đóng danh sách"
            onClick={() => close()}
          />
          <div id={selectorId} className="selector-menu" role="listbox">
            <div ref={listRef} className="selector-options">
              {visibleOptions.length ? (
                visibleOptions.map((option, optionIndex) => (
                  <button
                    key={option.value || "__empty"}
                    className={`${optionIndex === index ? "active" : ""} ${option.value === String(value) ? "selected" : ""
                      }`}
                    type="button"
                    role="option"
                    aria-selected={option.value === String(value)}
                    disabled={option.disabled}
                    onMouseEnter={() => setIndex(optionIndex)}
                    onClick={() => choose(option)}
                  >
                    {option.label}
                  </button>
                ))
              ) : (
                <p className="selector-empty">Không tìm thấy lựa chọn phù hợp.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

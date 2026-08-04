import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

type FieldLabelProps = {
  children: ReactNode;
  required?: boolean;
  icon?: LucideIcon;
};

export function FieldLabel({
  children,
  required = false,
  icon: Icon,
}: FieldLabelProps) {
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const parent = labelRef.current?.parentElement;
    const control = parent?.querySelector<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >("input, textarea, select");
    if (!parent || !control) return;

    if (
      control instanceof HTMLInputElement &&
      [
        "button",
        "checkbox",
        "color",
        "file",
        "hidden",
        "radio",
        "reset",
        "submit",
      ].includes(control.type)
    ) {
      return;
    }

    parent.classList.add("floating-label-field");
    if (
      control instanceof HTMLInputElement ||
      control instanceof HTMLTextAreaElement
    ) {
      control.setAttribute("placeholder", " ");
    }
    return () => parent.classList.remove("floating-label-field");
  }, []);

  return (
    <span ref={labelRef} className="field-label">
      {Icon && <Icon size={16} aria-hidden="true" />}
      <span>{children}</span>
      {required && <b aria-label="Bắt buộc">*</b>}
    </span>
  );
}

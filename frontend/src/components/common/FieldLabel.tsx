import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

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
  return (
    <span className="field-label">
      {Icon && <Icon size={16} aria-hidden="true" />}
      <span>{children}</span>
      {required && <b aria-label="Bắt buộc">*</b>}
    </span>
  );
}

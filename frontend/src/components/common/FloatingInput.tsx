import type { InputHTMLAttributes, ReactNode } from "react";

type FloatingInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: ReactNode;
  wrapperClassName?: string;
};

export function FloatingInput({
  label,
  icon,
  wrapperClassName = "",
  className = "",
  ...inputProps
}: FloatingInputProps) {
  return (
    <label
      className={`floating-input-field ${icon ? "has-icon" : ""} ${wrapperClassName}`}
    >
      {icon}
      <span className="floating-input-label">{label}</span>
      <input
        {...inputProps}
        className={className}
        placeholder=" "
        spellCheck={false}
      />
    </label>
  );
}

import { useState, type InputHTMLAttributes } from "react";
import { Input } from "./input";
import { Label } from "./label";

interface ValidatedShadFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  label: string;
  hint?: string;
  value: string;
  onChange: (next: string) => void;
  validate?: (value: string) => string | null;
}

/**
 * Shadcn-flavoured Input wrapper with inline validation on blur.
 * Mirrors src/components/compose-builder/ServiceForm/Field.tsx#ValidatedInput
 * but renders Label + Input from ui/* for the Network/Volume forms which use
 * shadcn primitives instead of the editorial .input class.
 */
export function ValidatedShadField({
  label,
  hint,
  value,
  onChange,
  validate,
  className,
  onBlur,
  ...inputProps
}: ValidatedShadFieldProps) {
  const [touched, setTouched] = useState(false);
  const error = touched && validate ? validate(value) : null;
  const inputClass =
    (className ?? "shadow-sm") +
    (error ? " border-destructive focus-visible:ring-destructive/30" : "");
  return (
    <div className="space-y-2">
      {label ? <Label className="text-sm font-medium">{label}</Label> : null}
      <Input
        {...inputProps}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => {
          setTouched(true);
          onBlur?.(e);
        }}
        aria-invalid={error ? true : undefined}
        className={inputClass}
      />
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

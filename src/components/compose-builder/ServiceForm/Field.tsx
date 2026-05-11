import { useState, type InputHTMLAttributes, type ReactNode } from "react";

interface FieldProps {
  label: string;
  hint?: string;
  children: ReactNode;
  required?: boolean;
  error?: string | null;
}

export function Field({ label, hint, children, required, error }: FieldProps) {
  return (
    <div className={"svc-field" + (error ? " svc-field--error" : "")}>
      <label className="field-label">
        {required && <span className="bar" aria-hidden />}
        {label}
      </label>
      {children}
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="field-hint">{hint}</p>
      )}
    </div>
  );
}

interface ValidatedInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (next: string) => void;
  validate?: (value: string) => string | null;
  label: string;
  hint?: string;
  required?: boolean;
}

/**
 * Field + input wrapper that runs a validator on blur (and clears on re-edit
 * once the user has typed something correct). Errors surface inline via the
 * Field's `error` prop and as `aria-invalid` on the input.
 */
export function ValidatedInput({
  value,
  onChange,
  validate,
  label,
  hint,
  required,
  ...inputProps
}: ValidatedInputProps) {
  const [touched, setTouched] = useState(false);
  const error = touched && validate ? validate(value) : null;
  return (
    <Field label={label} hint={hint} required={required} error={error}>
      <input
        {...inputProps}
        className={inputProps.className ?? "input"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => {
          setTouched(true);
          inputProps.onBlur?.(e);
        }}
        aria-invalid={error ? true : undefined}
      />
    </Field>
  );
}

interface SectionHeadProps {
  title: string;
  sub?: string;
  action?: ReactNode;
}

export function SectionHead({ title, sub, action }: SectionHeadProps) {
  return (
    <div className="svc-section-head">
      <div>
        <h3 className="svc-section-title">{title}</h3>
        {sub && <p className="svc-section-sub">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

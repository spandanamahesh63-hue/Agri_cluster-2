import clsx from "clsx";
import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

const control =
  "w-full rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink outline-none placeholder:text-ink-subtle focus:border-brand-500 focus:ring-2 focus:ring-brand-100 aria-[invalid=true]:border-danger";

interface FieldProps {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  className?: string;
  children: (props: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => ReactNode;
}

/** Label + control + hint/error, wired for screen readers. */
export function FormField({ label, hint, error, className, children }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const describedBy = error || hint ? hintId : undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-ink">
        {label}
      </label>
      {children({ id, "aria-invalid": !!error, "aria-describedby": describedBy })}
      {(error || hint) && (
        <p id={hintId} className={clsx("mt-1.5 text-[12px]", error ? "text-danger" : "text-ink-subtle")}>
          {error || hint}
        </p>
      )}
    </div>
  );
}

export function TextInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={clsx(control, "h-10", className)} {...rest} />;
}

export function SelectInput({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={clsx(control, "h-10", className)} {...rest}>
      {children}
    </select>
  );
}

export function TextArea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={clsx(control, "py-2 leading-relaxed", className)} {...rest} />;
}

interface ChoiceCardsProps<T extends string> {
  legend: string;
  name: string;
  value: T;
  options: { id: T; title: string; description?: string }[];
  onChange: (value: T) => void;
  columns?: 1 | 2 | 3;
}

/** Radio group rendered as selectable cards. */
export function ChoiceCards<T extends string>({ legend, name, value, options, onChange, columns = 1 }: ChoiceCardsProps<T>) {
  return (
    <fieldset>
      <legend className="mb-2 text-[13px] font-medium">{legend}</legend>
      <div className={clsx("grid gap-2", columns === 2 && "sm:grid-cols-2", columns === 3 && "sm:grid-cols-3")}>
        {options.map((o) => {
          const selected = o.id === value;
          return (
            <label
              key={o.id}
              className={clsx(
                "flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-200",
                selected ? "border-brand-500 bg-brand-50" : "border-line hover:border-line-strong",
              )}
            >
              <input type="radio" name={name} value={o.id} checked={selected} onChange={() => onChange(o.id)} className="mt-0.5 accent-brand-700" />
              <span>
                <span className="block text-[13px] font-medium text-ink">{o.title}</span>
                {o.description && <span className="block text-[12px] leading-snug text-ink-muted">{o.description}</span>}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

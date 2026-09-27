import clsx from "clsx";
import type { Role } from "../../types";
import { roleList } from "../../components/navigation/navConfig";

interface RoleSelectProps {
  value: Role;
  onChange: (role: Role) => void;
  /** Compact: a native select. Full: radio cards with descriptions. */
  compact?: boolean;
}

export function RoleSelect({ value, onChange, compact }: RoleSelectProps) {
  if (compact) {
    return (
      <div>
        <label htmlFor="role" className="mb-1.5 block text-[13px] font-medium">
          I am a
        </label>
        <select
          id="role"
          value={value}
          onChange={(e) => onChange(e.target.value as Role)}
          className="h-10 w-full rounded-lg border border-line-strong bg-surface px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        >
          {roleList.map((r) => (
            <option key={r.role} value={r.role}>
              {r.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <fieldset>
      <legend className="mb-2 text-[13px] font-medium">How will you use AgriCluster?</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {roleList.map((r) => {
          const selected = r.role === value;
          return (
            <label
              key={r.role}
              className={clsx(
                "flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-200",
                selected ? "border-brand-500 bg-brand-50" : "border-line hover:border-line-strong",
              )}
            >
              <input type="radio" name="role" value={r.role} checked={selected} onChange={() => onChange(r.role)} className="sr-only" />
              <r.icon aria-hidden className={clsx("mt-0.5 size-4 shrink-0", selected ? "text-brand-700" : "text-ink-subtle")} />
              <span>
                <span className="block text-[13px] font-medium text-ink">{r.label}</span>
                <span className="block text-[12px] leading-snug text-ink-muted">{r.tagline}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

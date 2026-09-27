// Tooltip body for Recharts: ink text, colour carried by the swatch only.
interface Entry {
  name?: string | number;
  value?: number | string | (number | string)[];
  color?: string;
  dataKey?: string | number;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: readonly Entry[];
  unit?: string;
  labelFormatter?: (label: string | number) => string;
}

export function ChartTooltip({ active, label, payload, unit = "", labelFormatter }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-[12px] shadow-pop">
      {label !== undefined && <div className="mb-1 font-medium text-ink">{labelFormatter ? labelFormatter(label) : label}</div>}
      <ul className="space-y-0.5">
        {payload.map((p) => (
          <li key={String(p.dataKey)} className="flex items-center gap-2 text-ink-muted">
            <span aria-hidden className="size-2 rounded-sm" style={{ background: p.color }} />
            <span>{p.name}</span>
            <span className="ml-auto pl-3 font-medium tabular-nums text-ink">
              {String(p.value)}
              {unit}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

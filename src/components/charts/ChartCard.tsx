import { useState, type ReactNode } from "react";
import clsx from "clsx";
import type { DataSource } from "../../types";
import { Card } from "../ui/Card";
import { SourceBadge } from "../ui/Badge";

export interface LegendItem {
  label: string;
  color: string;
  kind?: "bar" | "line";
}

interface ChartCardProps {
  title: string;
  subtitle?: ReactNode;
  source: DataSource;
  legend?: LegendItem[];
  table: { columns: string[]; rows: (string | number)[][] };
  footer?: ReactNode;
  children: ReactNode;
}

/** Frame for every chart: title, legend (≥2 series), a table view, and data-source label. */
export function ChartCard({ title, subtitle, source, legend, table, footer, children }: ChartCardProps) {
  const [view, setView] = useState<"chart" | "table">("chart");
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-4">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[13px] text-ink-muted">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          <SourceBadge source={source} />
          <div className="inline-flex rounded-md border border-line p-0.5 text-[12px]" role="group" aria-label="Display as">
            {(["chart", "table"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className={clsx("rounded px-2 py-0.5 capitalize", view === v ? "bg-sunken font-medium text-ink" : "text-ink-muted")}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {legend && legend.length > 1 && view === "chart" && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 px-5 pt-3 text-[12px] text-ink-muted">
          {legend.map((l) => (
            <li key={l.label} className="flex items-center gap-1.5">
              <span
                aria-hidden
                className={clsx(l.kind === "line" ? "h-0.5 w-3.5 rounded-full" : "size-2.5 rounded-sm")}
                style={{ background: l.color }}
              />
              {l.label}
            </li>
          ))}
        </ul>
      )}

      <div className="px-2 pb-3 pt-2 sm:px-3">
        {view === "chart" ? (
          <div className="h-56 w-full sm:h-64">{children}</div>
        ) : (
          <div className="overflow-x-auto px-3">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-line text-left text-ink-muted">
                  {table.columns.map((c, i) => (
                    <th key={c} scope="col" className={clsx("py-2 pr-4 font-medium", i > 0 && "text-right")}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {table.rows.map((row, r) => (
                  <tr key={r} className="border-b border-line last:border-0">
                    {row.map((cell, i) => (
                      <td key={i} className={clsx("py-2 pr-4", i > 0 && "text-right")}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {footer && <div className="border-t border-line px-5 py-3 text-[13px] text-ink-muted">{footer}</div>}
    </Card>
  );
}

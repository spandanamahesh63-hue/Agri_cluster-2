import { Link, useNavigate } from "react-router-dom";
import { CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Package, Truck, Warehouse } from "lucide-react";
import { StepLayout } from "../../../features/plan/StepLayout";
import { usePlan } from "../../../features/plan/usePlan";
import { stepHref } from "../../../features/plan/steps";
import { useRequirements } from "../../../features/shared/useMerged";
import { Card, CardHeader } from "../../../components/ui/Card";
import { Badge, InfoNote, SourceBadge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { ChartCard } from "../../../components/charts/ChartCard";
import { ChartTooltip } from "../../../components/charts/ChartTooltip";
import { chrome, series, tickStyle } from "../../../components/charts/palette";
import { EmptyState } from "../../../components/ui/states";
import { formatDate, formatDateRange } from "../../../utils/format";

const levelWord = { low: "Low", moderate: "Moderate", high: "High" };

/** Step 6 — market analysis for the chosen crop (spec §14). Sample data, clearly marked. */
export function MarketStep() {
  const p = usePlan();
  const navigate = useNavigate();
  const requirements = useRequirements().filter((r) => r.status === "open" && r.crop === p.crop?.name);
  const harvestTask = p.calendar.find((t) => t.stage === "harvest" && t.title.startsWith("First"));
  const harvestMonth = harvestTask ? formatDate(harvestTask.date, { month: "short" }) : undefined;

  const next = () => {
    p.markReviewed("market");
    navigate(stepHref(p.done.investment ? "schedule" : "investment"));
  };

  if (!p.market || !p.crop) {
    return (
      <StepLayout step="market">
        <Card>
          <EmptyState title="No market data for this crop yet" description="Sample market data is available for the crops in the catalogue." />
        </Card>
      </StepLayout>
    );
  }
  const m = p.market;

  return (
    <StepLayout step="market" description={`${p.crop.name}: prices, demand, and what buyers expect.`} action={<Button onClick={next}>Build my cropping plan</Button>}>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <div className="text-[12px] text-ink-muted">Indicative price now</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">
            ₹{m.current[0]}–{m.current[1]}/kg
          </div>
          <SourceBadge source={m.source} className="mt-1" />
        </Card>
        <Card className="p-4">
          <div className="text-[12px] text-ink-muted">Demand</div>
          <div className="mt-1 text-2xl font-semibold">{levelWord[m.demand]}</div>
          <div className="text-[12px] text-ink-muted">{requirements.length} open buyer request{requirements.length === 1 ? "" : "s"} in the cluster</div>
        </Card>
        <Card className="p-4">
          <div className="text-[12px] text-ink-muted">Your harvest timing</div>
          <div className="mt-1 text-2xl font-semibold">{harvestTask ? formatDate(harvestTask.date) : "—"}</div>
          <div className="text-[12px] text-ink-muted">From your cropping plan</div>
        </Card>
      </div>

      <ChartCard
        title="Price over the last 12 months"
        subtitle="Sample seasonal pattern, ₹ per kg. Not live market data."
        source="indicative"
        table={{ columns: ["Month", "₹/kg"], rows: m.history.map((h) => [h.month, h.pricePerKg]) }}
        footer={m.seasonalNote}
      >
        <ResponsiveContainer>
          <LineChart data={m.history} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={chrome.grid} />
            {harvestMonth && <ReferenceArea x1={harvestMonth} x2={harvestMonth} fill={series[1]} fillOpacity={0.12} label={{ value: "Your harvest", position: "insideTop", fontSize: 11, fill: "#56615a" }} />}
            <XAxis dataKey="month" tick={tickStyle} tickLine={false} axisLine={{ stroke: chrome.axis }} />
            <YAxis tick={tickStyle} tickLine={false} axisLine={false} width={40} unit="" />
            <Tooltip content={<ChartTooltip unit=" ₹/kg" />} cursor={{ stroke: chrome.axis }} />
            <Line dataKey="pricePerKg" name="Price" stroke={series[0]} strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: chrome.surface, strokeWidth: 2 }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <Card>
        <CardHeader title="Who buys it" subtitle="Buyer categories for this crop" />
        <div className="flex flex-wrap gap-1.5 px-5 pb-4 pt-3">
          {p.crop.markets.map((b) => (
            <Badge key={b} tone="market">
              {b}
            </Badge>
          ))}
        </div>
        {requirements.length > 0 ? (
          <ul className="divide-y divide-line border-t border-line">
            {requirements.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-[13px]">
                <span>
                  <span className="font-medium">
                    {r.quantityTonnes} t · Grade {r.grade}
                  </span>{" "}
                  <span className="text-ink-muted">
                    · {r.buyerLabel} · {formatDateRange(r.window.start, r.window.end)} · ₹{r.indicativePricePerKg[0]}–{r.indicativePricePerKg[1]}/kg
                  </span>
                </span>
                <Link to="/farmer/market" className="text-[13px] font-medium text-brand-700 hover:underline">
                  View in Market
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="border-t border-line px-5 py-3 text-[13px] text-ink-muted">No open buyer requests for this crop right now.</p>
        )}
      </Card>

      <div className="grid gap-3 md:grid-cols-3">
        {[
          { icon: Package, title: "Quality buyers expect", body: m.quality },
          { icon: Warehouse, title: "Storage", body: [m.storage] },
          { icon: Truck, title: "Transport", body: [m.transport] },
        ].map((b) => (
          <Card key={b.title} className="p-4 text-[13px]">
            <div className="flex items-center gap-2 font-medium">
              <b.icon aria-hidden className="size-4 text-ink-subtle" />
              {b.title}
            </div>
            <ul className="mt-2 space-y-1 text-ink-muted">
              {b.body.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
      <InfoNote>Prices and demand here are sample data for the prototype. A real version would show a verified source and the date it was updated.</InfoNote>
    </StepLayout>
  );
}

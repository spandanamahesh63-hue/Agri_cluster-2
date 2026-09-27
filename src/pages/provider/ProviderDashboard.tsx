import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useAppStore } from "../../store/AppStore";
import { useProvider } from "../../features/provider/useProvider";
import { BookingRow } from "../../features/provider/BookingRow";
import { StatTile } from "../../features/cluster/StatTile";
import { resourceDemand } from "../../data/mock/resources";
import { kindLabels } from "../../features/resources/labels";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardHeader } from "../../components/ui/Card";
import { ButtonLink } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/states";
import { DEMO_NOW } from "../../data/mock/clock";
import { formatDate, formatINR, greeting } from "../../utils/format";

export function ProviderDashboard() {
  const { session } = useAppStore();
  const p = useProvider();
  const earnings = p.upcoming.reduce((s, b) => s + b.estimatedCost, 0);
  const gaps = resourceDemand.filter((d) => d.requested > d.available && p.equipment.some((m) => m.kind === d.kind));

  return (
    <>
      <PageHeader
        eyebrow="Equipment provider · Mysuru Vegetable Cluster"
        title={`${greeting(DEMO_NOW)}, ${session?.name}`}
        description="Which requests and bookings need your attention?"
        actions={
          <ButtonLink to="/provider/equipment?add=1" icon={<Plus aria-hidden className="size-4" />}>
            Add equipment
          </ButtonLink>
        }
      />
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Equipment listed" value={p.equipment.length} to="/provider/equipment" />
          <StatTile label="New requests" value={p.requests.length} status={p.requests.length ? "moderate" : "healthy"} to="/provider/bookings" />
          <StatTile label="Confirmed bookings" value={p.upcoming.length} to="/provider/bookings" />
          <StatTile label="Confirmed value" value={formatINR(earnings)} sub="Indicative, before costs" />
        </div>

        {gaps.map((g) => (
          <Card key={`${g.kind}-${g.date}`} className="border-warning/30 bg-warning-soft p-4 text-[13px]">
            <span className="font-medium">
              Cluster demand: {g.requested} {kindLabels[g.kind].toLowerCase()} requests for {g.available} available on {formatDate(g.date)}.
            </span>{" "}
            <span className="text-ink-muted">Opening extra slots on that day helps farmers and fills your calendar.</span>{" "}
            <Link to="/provider/equipment" className="font-medium text-brand-700 hover:underline">
              Set availability
            </Link>
          </Card>
        ))}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Requests to review" subtitle="Farmers waiting for your answer" />
            {p.requests.length === 0 ? (
              <EmptyState title="No new requests" />
            ) : (
              <ul className="mt-2 divide-y divide-line">
                {p.requests.map((b) => (
                  <BookingRow key={b.id} booking={b} machine={p.equipment.find((m) => m.id === b.machineryId)} />
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <CardHeader title="Upcoming bookings" subtitle="Confirmed with farmers" />
            {p.upcoming.length === 0 ? (
              <EmptyState title="No confirmed bookings" />
            ) : (
              <ul className="mt-2 divide-y divide-line">
                {p.upcoming.map((b) => (
                  <BookingRow key={b.id} booking={b} machine={p.equipment.find((m) => m.id === b.machineryId)} />
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

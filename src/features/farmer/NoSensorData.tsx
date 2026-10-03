import type { ReactNode } from "react";
import { RadioTower } from "lucide-react";
import { useAppStore } from "../../store/AppStore";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/states";
import { ButtonLink } from "../../components/ui/Button";

/**
 * Real accounts: screens built on field sensors, weather feeds or the cluster's
 * farm roster have nothing true to show until those are connected. Say so
 * plainly instead of showing sample numbers.
 */
export function NoSensorData({ title, what, back, heading = "No sensor data yet", footer }: { title: string; what: string; back?: { to: string; label: string }; heading?: string; footer?: string }) {
  return (
    <>
      <PageHeader title={title} />
      <Card>
        <EmptyState
          icon={<RadioTower aria-hidden className="size-5 text-ink-subtle" />}
          title={heading}
          description={`${what} ${footer ?? "This screen fills in once soil-moisture sensors, a pump meter or a weather feed are connected for your farm. Ask the cluster office about joining the sensor pilot."}`}
          action={
            back && (
              <ButtonLink to={back.to} variant="secondary" size="sm">
                {back.label}
              </ButtonLink>
            )
          }
        />
      </Card>
    </>
  );
}

/** In the demo, the screen; for real accounts, an honest "no data yet". */
export function SensorScreen({ title, what, cluster, children }: { title: string; what: string; cluster?: boolean; children: ReactNode }) {
  const { session } = useAppStore();
  if (session?.mode !== "real") return children;
  return cluster ? (
    <NoSensorData title={title} heading="No cluster data yet" what={what} footer="It fills in as member farms join and connect sensors. Until then, use Support, People and Revenue." />
  ) : (
    <NoSensorData title={title} what={what} back={{ to: "/farmer/plan", label: "Go to my plan" }} />
  );
}

import { Hammer } from "lucide-react";
import type { NavItem } from "../../components/navigation/navConfig";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/states";

/** Honest placeholder for a screen that exists in navigation but is not built yet. */
export function PlannedPage({ item }: { item: NavItem }) {
  return (
    <>
      <PageHeader title={item.label} description={item.question} />
      <Card>
        <EmptyState
          icon={<Hammer aria-hidden className="size-5" />}
          title="This screen is not built yet"
          description="It is being built in an upcoming phase. Navigation and role access for it are already in place."
        />
      </Card>
    </>
  );
}

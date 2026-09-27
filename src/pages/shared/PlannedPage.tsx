import { Hammer } from "lucide-react";
import type { Role } from "../../types";
import type { NavItem } from "../../components/navigation/navConfig";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/states";

// Which implementation priority (spec §83) delivers each role's screens.
const plannedPriority: Record<Role, number> = { farmer: 2, cluster: 3, buyer: 4, provider: 4, labour: 4, expert: 4 };

/** Honest placeholder for a screen that exists in navigation but is not built yet. */
export function PlannedPage({ role, item }: { role: Role; item: NavItem }) {
  const priority = item.path === "community" ? 4 : plannedPriority[role];
  return (
    <>
      <PageHeader title={item.label} description={item.question} />
      <Card>
        <EmptyState
          icon={<Hammer aria-hidden className="size-5" />}
          title="This screen is not built yet"
          description={`It is scheduled for implementation priority ${priority}. Navigation and role access for it are already in place.`}
        />
      </Card>
    </>
  );
}

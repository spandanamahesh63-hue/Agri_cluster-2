import { useNavigate } from "react-router-dom";
import type { Role } from "../../types";
import { useAppStore } from "../../store/AppStore";
import { cluster } from "../../data/mock/cluster";
import { users } from "../../data/mock/users";
import { experts, expertCategoryLabels } from "../../data/mock/experts";
import { roles } from "../../components/navigation/navConfig";
import { publicLabel } from "../../features/shared/identity";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

/** Account & public identity for roles without a dedicated profile editor. */
export function RoleProfilePage({ role }: { role: Role }) {
  const { session, resetDemo } = useAppStore();
  const navigate = useNavigate();
  const user = users.find((u) => u.id === session?.userId);
  const expert = experts.find((e) => e.userId === session?.userId);

  const rows: [string, string | undefined][] = [
    ["Name", session?.name],
    ["Role", roles[role].label],
    ["Cluster", cluster.name],
    ["Location", user?.location],
    ["Shown to others as", session ? publicLabel(session.userId, role) : undefined],
  ];
  if (expert) {
    rows.push(["Expertise", `${expertCategoryLabels[expert.category]} · ${expert.expertise.join(", ")}`]);
    rows.push(["Languages", expert.languages.join(", ")]);
  }

  return (
    <>
      <PageHeader title="Profile" description="Your account and how you appear to cluster members." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Account" />
          <dl className="divide-y divide-line px-5 pb-2 pt-2 text-[13px]">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2.5">
                <dt className="text-ink-muted">{k}</dt>
                <dd className="text-right font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
        <Card>
          <CardHeader title="Demo data" subtitle="Everything you create is stored only in this browser" />
          <div className="px-5 pb-5 pt-3">
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                resetDemo();
                navigate("/login");
              }}
            >
              Reset demo
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}

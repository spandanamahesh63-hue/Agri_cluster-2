import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAppStore } from "../../store/AppStore";
import { useAccount } from "../../features/accounts/AccountProvider";
import { listProfiles } from "../../services/auth/accounts";
import { realMembers } from "../../services/mode";
import { roleList } from "../../components/navigation/navConfig";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardHeader } from "../../components/ui/Card";
import { InfoNote } from "../../components/ui/Badge";
import { greeting } from "../../utils/format";
import { ClusterOverviewPage } from "./ClusterOverviewPage";

/** Cluster office home: the sample cluster in the demo, real members and requests for real accounts. */
export function ClusterHome() {
  const { session } = useAppStore();
  return session?.mode === "real" ? <RealClusterHome /> : <ClusterOverviewPage />;
}

function RealClusterHome() {
  const { session, supportRequests, listings, requirements, bookings, labourRequests, interests } = useAppStore();
  const { account } = useAccount();
  const admin = account.status === "ready" && account.profile.is_admin;
  const [waiting, setWaiting] = useState<number | null>(null);
  useEffect(() => {
    if (!admin) return;
    listProfiles()
      .then((all) => setWaiting(all.filter((p) => p.status === "pending").length))
      .catch(() => setWaiting(null));
  }, [admin]);

  const members = realMembers();
  const open = (s: string) => !["closed", "completed", "declined", "withdrawn", "agreed"].includes(s);
  const rows = [
    ...(admin ? [{ label: "People waiting for approval", count: waiting ?? "–", to: "/cluster/people" }] : []),
    { label: "Help requests from farmers", count: supportRequests.filter((r) => open(r.status)).length, to: "/cluster/support" },
    { label: "Crops listed for sale", count: listings.filter((l) => open(l.status)).length, to: "/cluster/revenue" },
    { label: "Open buyer requirements", count: requirements.filter((r) => r.status === "open").length, to: "/cluster/revenue" },
    { label: "Buyer requests waiting for farmers", count: interests.filter((i) => i.status === "pending").length, to: "/cluster/revenue" },
    { label: "Machinery and labour requests", count: [...bookings, ...labourRequests].filter((r) => r.status === "requested").length, to: "/cluster/revenue" },
  ];

  return (
    <>
      <PageHeader title={`${greeting(new Date())}, ${(session?.name ?? "").split(" ")[0]}`} description="Who has joined, and what needs the cluster office today?" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Needs attention" />
          <ul className="divide-y divide-line px-5 pb-2 pt-1">
            {rows.map((r) => (
              <li key={r.label}>
                <Link to={r.to} className="flex items-center justify-between gap-3 py-3 text-[13px] hover:text-brand-700">
                  <span>{r.label}</span>
                  <span className="flex items-center gap-2">
                    <span className="font-medium tabular-nums">{r.count}</span>
                    <ArrowRight aria-hidden className="size-3.5 text-ink-subtle" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Members" subtitle={`${members.length} approved`} />
          <dl className="space-y-1.5 px-5 pb-4 pt-2 text-[13px]">
            {roleList.map((r) => (
              <div key={r.role} className="flex justify-between gap-3">
                <dt className="text-ink-muted">{r.label}</dt>
                <dd className="font-medium tabular-nums">{members.filter((m) => m.role === r.role).length}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
      <InfoNote className="mt-4">Water, energy, crop and impact screens fill in when member farms connect sensors.</InfoNote>
    </>
  );
}

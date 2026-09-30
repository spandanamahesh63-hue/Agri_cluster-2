import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { SupportNeed, SupportScheme } from "../../types";
import { useAppStore } from "../../store/AppStore";
import { usePlan } from "../../features/plan/usePlan";
import { SupportCard, supportStatus } from "../../features/support/SupportCard";
import { supportHelpLabels } from "../../features/notifications/rules";
import { LAST_CHECKED, needLabels, supportById } from "../../data/catalog/support";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Badge, InfoNote } from "../../components/ui/Badge";
import { ButtonLink } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/states";
import { Tabs } from "../../components/navigation/Tabs";
import { FilterChips } from "../../components/navigation/FilterChips";
import { formatDate } from "../../utils/format";

type Tab = "plan" | "government" | "private" | "requests";

/** Government and private-sector support for the farmer (spec §18). */
export function SupportPage() {
  const p = usePlan();
  const { session, supportRequests } = useAppStore();
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as Tab) ?? "plan";
  const setTab = (t: Tab) => setParams({ tab: t }, { replace: true });
  const [need, setNeed] = useState<SupportNeed | "all">("all");

  const mine = supportRequests.filter((r) => r.requesterUserId === session?.userId);
  const requestFor = (id: string) => mine.find((r) => r.schemeId === id && r.status !== "closed");
  const rows = p.allSupport;
  const counts = {
    plan: rows.filter((r) => r.why).length,
    government: rows.filter((r) => r.scheme.sector === "government").length,
    private: rows.filter((r) => r.scheme.sector === "private").length,
  };
  const visible = rows.filter(
    (r) =>
      (tab === "plan" ? !!r.why : r.scheme.sector === tab) && (need === "all" || r.scheme.needs.includes(need)),
  );
  // Government options first, then private, keeping catalogue order within each.
  visible.sort((a, b) => (a.scheme.sector === b.scheme.sector ? 0 : a.scheme.sector === "government" ? -1 : 1));

  return (
    <>
      <PageHeader decorated title="Support" description="Which government schemes and private options could help, and who can help me apply?" />
      <InfoNote className="mb-4">
        Government facts come from official sources, checked on {formatDate(LAST_CHECKED)}. Rules and amounts change, and AgriCluster doesn't decide who
        qualifies. Confirm with the office before you apply.
      </InfoNote>
      <Tabs<Tab>
        label="Support"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "plan", label: "For your plan", count: counts.plan },
          { id: "government", label: "Government", count: counts.government },
          { id: "private", label: "Private sector", count: counts.private },
          { id: "requests", label: "My requests", count: mine.length },
        ]}
      />

      {tab === "requests" ? (
        <RequestsList requests={mine} />
      ) : (
        <div className="space-y-4">
          {tab === "plan" && !p.crop && (
            <Card className="flex flex-col gap-3 p-4 text-[13px] sm:flex-row sm:items-center sm:justify-between">
              <span>Choose a crop and method in your season plan to see support matched to them.</span>
              <ButtonLink to="/farmer/plan" size="sm" variant="secondary" className="shrink-0">
                Open plan
              </ButtonLink>
            </Card>
          )}
          {tab === "private" && (
            <InfoNote>
              Private options are described by type of provider. AgriCluster has no partnership with any company and does not recommend one over another.
            </InfoNote>
          )}
          <FilterChips<SupportNeed | "all">
            label="Need"
            value={need}
            onChange={setNeed}
            options={[{ id: "all", label: "All needs" }, ...(Object.keys(needLabels) as SupportNeed[]).map((n) => ({ id: n, label: needLabels[n] }))]}
          />
          {visible.length === 0 ? (
            <Card>
              <EmptyState title="Nothing for this need here" description="Try another need or tab." />
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {visible.map(({ scheme, why }) => (
                <SupportCard key={scheme.id} scheme={scheme} why={why} request={requestFor(scheme.id)} />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

function RequestsList({ requests }: { requests: ReturnType<typeof useAppStore>["supportRequests"] }) {
  if (requests.length === 0)
    return (
      <Card>
        <EmptyState title="No support requests yet" description="Use “Ask for help applying” on any scheme or option. The cluster office will reply here." />
      </Card>
    );
  return (
    <Card>
      <ul className="divide-y divide-line">
        {requests.map((r) => {
          const s = supportById(r.schemeId) as SupportScheme;
          const st = supportStatus[r.status];
          return (
            <li key={r.id} className="flex flex-col gap-2 px-5 py-3.5 text-[13px] sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="font-medium">{s?.name}</div>
                <div className="text-ink-muted">
                  {supportHelpLabels[r.help]} · {r.contact === "call" ? "Call me" : "Meet at the RSK"} · sent {formatDate(r.createdAt)}
                </div>
                {r.note && <div className="text-ink-muted">“{r.note}”</div>}
                {r.officeNote && (
                  <p className="mt-1 rounded-lg bg-canvas px-3 py-2">
                    <span className="font-medium">Cluster office: </span>
                    {r.officeNote}
                  </p>
                )}
              </div>
              <Badge tone={st.tone} className="self-start">
                {st.label}
              </Badge>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

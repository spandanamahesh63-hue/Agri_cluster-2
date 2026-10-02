import { useCallback, useEffect, useState } from "react";
import { MapPin, Phone } from "lucide-react";
import type { Role } from "../../types";
import { roleList, roles } from "../../components/navigation/navConfig";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Badge, InfoNote } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState, ErrorState, PageSkeleton } from "../../components/ui/states";
import { FilterChips } from "../../components/navigation/FilterChips";
import { useToast } from "../../components/ui/Toast";
import { formatPhone, friendlyAuthError, listProfiles, reviewProfile, type Profile, type ProfileStatus } from "../../services/auth/accounts";
import { useAccount } from "../../features/accounts/AccountProvider";
import { formatDate } from "../../utils/format";
import { NotFoundPage } from "../shared/NotFoundPage";

type Filter = "pending" | "approved" | "rejected";
const statusBadge: Record<ProfileStatus, { label: string; tone: "warning" | "success" | "neutral" }> = {
  pending: { label: "Waiting", tone: "warning" },
  approved: { label: "Approved", tone: "success" },
  rejected: { label: "Not approved", tone: "neutral" },
};

/** Admins: approve the people who asked to join as cluster office, buyer, provider, labour, expert or organiser. */
export function PeoplePage() {
  const { account } = useAccount();
  const admin = account.status === "ready" && account.profile.is_admin;
  const [people, setPeople] = useState<Profile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("pending");

  const load = useCallback(() => {
    setError(null);
    listProfiles()
      .then(setPeople)
      .catch((e) => setError(friendlyAuthError(e)));
  }, []);
  useEffect(() => {
    if (admin) load();
  }, [admin, load]);

  if (!admin) return <NotFoundPage />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!people) return <PageSkeleton />;

  const counts = { pending: 0, approved: 0, rejected: 0 } as Record<Filter, number>;
  people.forEach((p) => counts[p.status]++);
  const rows = people.filter((p) => p.status === filter);
  const replace = (p: Profile) => setPeople((list) => list!.map((x) => (x.id === p.id ? p : x)));

  return (
    <>
      <PageHeader title="People" description="Who has asked to join, and who can see farmers' requests?" />
      <div className="mb-4">
        <FilterChips<Filter>
          label="Show"
          value={filter}
          onChange={setFilter}
          options={[
            { id: "pending", label: `Waiting (${counts.pending})` },
            { id: "approved", label: `Approved (${counts.approved})` },
            { id: "rejected", label: `Not approved (${counts.rejected})` },
          ]}
        />
      </div>
      <Card>
        {rows.length === 0 ? (
          <EmptyState
            title={filter === "pending" ? "Nobody is waiting" : "No one here yet"}
            description={filter === "pending" ? "New requests to join as cluster office, buyer, provider, labour, expert or organiser appear here." : undefined}
          />
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((p) => (
              <PersonRow key={p.id} p={p} self={p.id === account.userId} onChange={replace} />
            ))}
          </ul>
        )}
      </Card>
      <InfoNote className="mt-4">Call the person before approving a cluster office, buyer or expert account. Approved accounts can see farmers' requests for their role.</InfoNote>
    </>
  );
}

function PersonRow({ p, self, onChange }: { p: Profile; self: boolean; onChange: (p: Profile) => void }) {
  const toast = useToast();
  const [role, setRole] = useState<Role>(p.role);
  const [busy, setBusy] = useState(false);
  const roleId = `role-${p.id}`;

  const review = async (status: ProfileStatus) => {
    setBusy(true);
    try {
      const next = await reviewProfile(p.id, { status, ...(role !== p.role && { role }) });
      onChange(next);
      toast(status === "approved" ? `${next.name} is approved as ${roles[next.role].label.toLowerCase()}.` : `${next.name} is not approved.`);
    } catch (e) {
      toast(friendlyAuthError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="flex flex-col gap-3 px-5 py-4 text-[13px] sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{p.name}</span>
          <Badge tone={statusBadge[p.status].tone}>{statusBadge[p.status].label}</Badge>
          {p.is_admin && <Badge tone="brand">Admin</Badge>}
        </div>
        <div className="text-ink-muted">
          {roles[p.role].label}
          {p.organisation && ` · ${p.organisation}`} · joined {formatDate(p.created_at.slice(0, 10))}
        </div>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
          {p.phone && (
            <a href={`tel:+${p.phone.replace(/\D/g, "")}`} className="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline">
              <Phone aria-hidden className="size-3.5" />
              {formatPhone(p.phone)}
            </a>
          )}
          {p.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin aria-hidden className="size-3.5 text-ink-subtle" />
              {p.location}
            </span>
          )}
        </div>
        {p.about && <p className="mt-1 text-ink-muted">“{p.about}”</p>}
      </div>
      {!self && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {p.status !== "approved" && (
            <>
              <label htmlFor={roleId} className="sr-only">
                Approve {p.name} as
              </label>
              <select
                id={roleId}
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="h-8 rounded-lg border border-line-strong bg-surface px-2 text-[13px]"
              >
                {roleList.map((r) => (
                  <option key={r.role} value={r.role}>
                    {r.label}
                  </option>
                ))}
              </select>
              <Button size="sm" onClick={() => void review("approved")} disabled={busy}>
                Approve
              </Button>
            </>
          )}
          {p.status !== "rejected" && (
            <Button size="sm" variant="ghost" onClick={() => void review("rejected")} disabled={busy}>
              {p.status === "approved" ? "Remove access" : "Don't approve"}
            </Button>
          )}
        </div>
      )}
    </li>
  );
}

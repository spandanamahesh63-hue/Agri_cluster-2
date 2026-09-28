import { useState } from "react";
import type { SupportRequest } from "../../types";
import { useAppStore } from "../../store/AppStore";
import { supportStatus } from "../../features/support/SupportCard";
import { supportHelpLabels } from "../../features/notifications/rules";
import { supportById } from "../../data/catalog/support";
import { farmLabelForUser } from "../../data/mock/farms";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Badge, InfoNote } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/states";
import { FilterChips } from "../../components/navigation/FilterChips";
import { TextInput } from "../../components/forms/fields";
import { useToast } from "../../components/ui/Toast";
import { formatDate } from "../../utils/format";

type Filter = "open" | "all";
const next: Partial<Record<SupportRequest["status"], { to: SupportRequest["status"]; label: string }[]>> = {
  requested: [
    { to: "in-progress", label: "Start helping" },
    { to: "documents-needed", label: "Ask for documents" },
  ],
  "in-progress": [
    { to: "documents-needed", label: "Ask for documents" },
    { to: "submitted", label: "Mark submitted" },
  ],
  "documents-needed": [{ to: "in-progress", label: "Documents received" }],
  submitted: [{ to: "closed", label: "Close" }],
};

/** Cluster office: farmers' requests for help with government schemes and private options. */
export function ClusterSupportPage() {
  const { supportRequests } = useAppStore();
  const [filter, setFilter] = useState<Filter>("open");
  const rows = [...supportRequests]
    .filter((r) => filter === "all" || r.status !== "closed")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const waiting = supportRequests.filter((r) => r.status === "requested").length;

  return (
    <>
      <PageHeader title="Support" description="Which farmers need help applying for schemes or comparing private offers?" />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <FilterChips<Filter>
          label="Show"
          value={filter}
          onChange={setFilter}
          options={[
            { id: "open", label: "Open" },
            { id: "all", label: "All" },
          ]}
        />
        <span className="text-[13px] text-ink-muted">{waiting} waiting for a first reply</span>
      </div>
      <Card>
        {rows.length === 0 ? (
          <EmptyState title="No open requests" description="Requests from farmers' Support pages appear here." />
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((r) => (
              <RequestRow key={r.id} r={r} />
            ))}
          </ul>
        )}
      </Card>
      <InfoNote className="mt-4">You see the farm label, the request and the scheme. Share details with a bank, insurer or company only with the farmer's agreement.</InfoNote>
    </>
  );
}

function RequestRow({ r }: { r: SupportRequest }) {
  const { update } = useAppStore();
  const toast = useToast();
  const [note, setNote] = useState("");
  const s = supportById(r.schemeId);
  const farm = farmLabelForUser(r.requesterUserId);
  const st = supportStatus[r.status];
  const noteId = `office-note-${r.id}`;

  return (
    <li className="px-5 py-4 text-[13px]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="font-medium">
            {farm} · {s?.name}
          </div>
          <div className="text-ink-muted">
            {supportHelpLabels[r.help]} · {r.contact === "call" ? "Call" : "Meet at the RSK"} · {formatDate(r.createdAt)} · {s?.level}
          </div>
          {r.note && <div className="text-ink-muted">“{r.note}”</div>}
          {r.officeNote && <div className="mt-1">Last note: {r.officeNote}</div>}
        </div>
        <Badge tone={st.tone} className="self-start">
          {st.label}
        </Badge>
      </div>
      {next[r.status] && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <label htmlFor={noteId} className="sr-only">
            Note for {farm}
          </label>
          <TextInput id={noteId} placeholder="Note for the farmer (optional)" value={note} onChange={(e) => setNote(e.target.value)} className="sm:max-w-md" />
          <div className="flex flex-wrap gap-2">
            {next[r.status]!.map((n) => (
              <Button
                key={n.to}
                size="sm"
                variant={n.to === "documents-needed" ? "ghost" : "secondary"}
                onClick={() => {
                  update("supportRequests", r.id, { status: n.to, ...(note.trim() ? { officeNote: note.trim() } : {}) });
                  setNote("");
                  toast(`${farm} has been notified.`);
                }}
              >
                {n.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </li>
  );
}

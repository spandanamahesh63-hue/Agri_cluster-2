import { useState } from "react";
import { Cloud, CloudOff, HardDrive, Link2, Loader2, RefreshCw } from "lucide-react";
import { useAppStore } from "../../store/AppStore";
import { cloudHost, databaseName, shareLink } from "../../services/storage/cloud";
import { Card, CardHeader } from "../../components/ui/Card";
import { InfoNote } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/ui/Toast";
import { formatTime } from "../../utils/format";

/** Compact status for the top bar: where the demo is being saved. */
export function StorageBadge() {
  const { storage } = useAppStore();
  if (storage.mode === "local")
    return (
      <span className="inline-flex items-center gap-1" title="Saved in this browser only">
        <HardDrive aria-hidden className="size-3.5" />
        Saved on this device
      </span>
    );
  const s = storage.status;
  return (
    <span className="inline-flex items-center gap-1" role="status" aria-live="polite" title={storage.error}>
      {s === "offline" ? (
        <CloudOff aria-hidden className="size-3.5 text-warning" />
      ) : s === "saving" || s === "connecting" ? (
        <Loader2 aria-hidden className="size-3.5 animate-spin" />
      ) : (
        <Cloud aria-hidden className="size-3.5 text-success" />
      )}
      {s === "offline" ? "Offline · saved on this device" : s === "connecting" ? "Connecting…" : s === "saving" ? "Saving…" : "Saved to database"}
    </span>
  );
}

/** Profile card: where data lives, the share link, and a fresh demo space. */
export function StorageCard() {
  const { storage, newDemoSpace, retryStorage } = useAppStore();
  const toast = useToast();
  const [confirmNew, setConfirmNew] = useState(false);
  const cloud = storage.mode === "cloud";
  const link = cloud ? shareLink(storage.workspaceId) : "";

  return (
    <Card>
      <CardHeader title="Where your data is saved" action={<StorageBadge />} />
      <div className="space-y-3 px-5 pb-5 pt-3 text-[13px]">
        {cloud ? (
          <>
            <p>
              This demo space is saved in the AgriCluster database ({databaseName}, <span className="font-mono text-[12px]">{cloudHost}</span>). Each browser gets its
              own space, so other visitors don't see your changes.
            </p>
            {storage.status === "saved" && storage.savedAt && <p className="text-ink-muted">Last saved at {formatTime(storage.savedAt)}.</p>}
            {storage.status === "offline" && (
              <div className="flex flex-wrap items-center gap-2 rounded-lg bg-warning-soft px-3 py-2">
                <span>Can't reach the database right now. Your changes are kept on this device.</span>
                <Button size="sm" variant="secondary" icon={<RefreshCw aria-hidden className="size-3.5" />} onClick={retryStorage}>
                  Try again
                </Button>
              </div>
            )}
            <div>
              <label htmlFor="share-link" className="mb-1 block text-[12px] font-medium text-ink-subtle">
                Open this demo on another device
              </label>
              <div className="flex gap-2">
                <input id="share-link" readOnly value={link} className="min-w-0 flex-1 rounded-lg border border-line-strong bg-canvas px-3 py-1.5 font-mono text-[12px]" onFocus={(e) => e.target.select()} />
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<Link2 aria-hidden className="size-3.5" />}
                  onClick={() => {
                    navigator.clipboard?.writeText(link).then(
                      () => toast("Link copied."),
                      () => toast("Select the link and copy it."),
                    );
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
            <InfoNote>Anyone with this link can open and change this demo space. Real farmer accounts would use phone sign-in instead.</InfoNote>
            {confirmNew ? (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-line px-3 py-2">
                <span>Start an empty demo space? This one stays reachable with its link.</span>
                <Button
                  size="sm"
                  onClick={() => {
                    newDemoSpace();
                    setConfirmNew(false);
                    toast("New demo space started.");
                  }}
                >
                  Start new space
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmNew(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setConfirmNew(true)}>
                Start a new demo space
              </Button>
            )}
          </>
        ) : (
          <p>This demo is saved in this browser only. Nothing is sent to a server. Clearing browser data or “Reset demo” wipes it.</p>
        )}
      </div>
    </Card>
  );
}

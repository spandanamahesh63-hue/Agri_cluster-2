// Cloud storage in Supabase (PostgreSQL), through its REST API.
//
// Each browser works in its own "demo space" (workspace), named by a long
// random id. Row-level security in the database (see supabase/schema.sql) only
// returns and accepts rows whose workspace id matches the x-workspace-id header,
// so one space can't read or change another. The id works like a key: anyone
// with a share link can open that space. Real sign-in (phone OTP) would replace
// this before any real farmer data is stored.

const URL_ = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, "");
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const WS_KEY = "agricluster:workspace";

/** Cloud storage is configured, and we are not inside an embedding host (which blocks outside requests). */
export const cloudConfigured = (() => {
  if (!URL_ || !KEY) return false;
  try {
    return window.self === window.top;
  } catch {
    return false;
  }
})();

export const cloudHost = URL_ ? new URL(URL_).host : undefined;

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;

const validId = (id: string | null | undefined): id is string => !!id && /^[A-Za-z0-9-]{20,64}$/.test(id);

/** The workspace for this browser: from a share link (?ws=…), else remembered, else new. */
export function currentWorkspaceId(): string {
  const fromHash = new URLSearchParams(location.hash.split("?")[1] ?? "").get("ws");
  const fromLink = new URLSearchParams(location.search).get("ws") ?? fromHash;
  let id: string | null = null;
  try {
    id = validId(fromLink) ? fromLink : localStorage.getItem(WS_KEY);
    if (!validId(id)) id = newId();
    localStorage.setItem(WS_KEY, id);
  } catch {
    id = validId(fromLink) ? fromLink : newId();
  }
  if (fromLink) {
    // Remove the id from the address bar so it isn't shared by accident.
    const url = new URL(location.href);
    url.searchParams.delete("ws");
    history.replaceState(history.state, "", url.toString());
  }
  return id!;
}

/** Start a fresh, empty demo space on this browser. */
export function startNewWorkspace(): string {
  const id = newId();
  try {
    localStorage.setItem(WS_KEY, id);
  } catch {
    /* in-memory only */
  }
  return id;
}

/** A link that opens the same demo space on another device. */
export function shareLink(workspaceId: string): string {
  const base = `${location.origin}${location.pathname}`;
  return import.meta.env.MODE === "single" ? `${base}?ws=${workspaceId}#/login` : `${location.origin}/login?ws=${workspaceId}`;
}

function headers(ws: string, extra: Record<string, string> = {}): HeadersInit {
  const h: Record<string, string> = { apikey: KEY!, "x-workspace-id": ws, "Content-Type": "application/json", ...extra };
  // Legacy anon keys are JWTs and go in Authorization too; new publishable keys (sb_…) don't.
  if (!KEY!.startsWith("sb_")) h.Authorization = `Bearer ${KEY}`;
  return h;
}

async function call(ws: string, path: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(`${URL_}/rest/v1/${path}`, { ...init, headers: headers(ws, (init.headers as Record<string, string>) ?? {}) });
  if (!res.ok) throw new Error(`Supabase ${init.method ?? "GET"} ${path.split("?")[0]} → ${res.status} ${(await res.text()).slice(0, 200)}`);
  return res;
}

export interface Snapshot {
  /** Everything that isn't a record collection (plan, profile, decisions, saved items…). */
  settings: Record<string, unknown>;
  /** Record collections: listings, bookings, requests, notifications… */
  collections: Record<string, { id: string }[]>;
}

/** Load a workspace; null when it has never been saved. */
export async function loadWorkspace(ws: string): Promise<Snapshot | null> {
  const [wsRes, recRes] = await Promise.all([
    call(ws, `workspaces?id=eq.${ws}&select=state`),
    call(ws, `records?workspace_id=eq.${ws}&select=collection,id,position,data&order=collection.asc,position.desc`),
  ]);
  const rows = (await wsRes.json()) as { state: Record<string, unknown> }[];
  if (rows.length === 0) return null;
  const recs = (await recRes.json()) as { collection: string; id: string; position: number; data: { id: string } }[];
  const collections: Snapshot["collections"] = {};
  for (const r of recs) (collections[r.collection] ??= []).push(r.data);
  return { settings: rows[0].state ?? {}, collections };
}

const fingerprint = (x: unknown) => JSON.stringify(x);

/**
 * Save what changed since `previous`: the settings row, changed or new records,
 * and deletions. Returns the snapshot now stored.
 */
export async function saveWorkspace(ws: string, next: Snapshot, previous: Snapshot | null): Promise<Snapshot> {
  if (!previous || fingerprint(previous.settings) !== fingerprint(next.settings)) {
    await call(ws, "workspaces?on_conflict=id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ id: ws, state: next.settings, updated_at: new Date().toISOString() }),
    });
  }

  const upserts: { workspace_id: string; collection: string; id: string; position: number; data: unknown; updated_at: string }[] = [];
  const now = new Date().toISOString();
  for (const [collection, items] of Object.entries(next.collections)) {
    // New records are added at the front, so positions count from the end: adding
    // one record doesn't change the stored position of the others.
    const prevItems = previous?.collections[collection] ?? [];
    const before = new Map(prevItems.map((r, i) => [r.id, fingerprint(r) + "#" + (prevItems.length - i)]));
    items.forEach((r, i) => {
      const position = items.length - i;
      if (before.get(r.id) !== fingerprint(r) + "#" + position) upserts.push({ workspace_id: ws, collection, id: r.id, position, data: r, updated_at: now });
    });
    const gone = (previous?.collections[collection] ?? []).map((r) => r.id).filter((id) => !items.some((r) => r.id === id));
    if (gone.length) {
      const list = gone.map((id) => `"${id.replace(/"/g, "")}"`).join(",");
      await call(ws, `records?workspace_id=eq.${ws}&collection=eq.${collection}&id=in.(${encodeURIComponent(list)})`, { method: "DELETE" });
    }
  }
  for (let i = 0; i < upserts.length; i += 200) {
    await call(ws, "records?on_conflict=workspace_id,collection,id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(upserts.slice(i, i + 200)),
    });
  }
  return next;
}

/** Delete a workspace and all its records (records cascade). */
export async function deleteWorkspace(ws: string): Promise<void> {
  await call(ws, `workspaces?id=eq.${ws}`, { method: "DELETE" });
}

// Cloud storage: MongoDB (through the app's own /api, see netlify/functions/api.mts)
// or Supabase (PostgreSQL, through its REST API).
//
// VITE_DATABASE picks one: "mongodb", "supabase" or "off". Unset = Supabase when
// its URL and key are set, else the browser only.
//
// Each browser works in its own "demo space" (workspace), named by a long
// random id. The server only returns and accepts rows whose workspace id matches
// the x-workspace-id header (MongoDB: checked in the function; Supabase: row-level
// security in supabase/schema.sql), so one space can't read or change another.
// The id works like a key: anyone with a share link can open that space. Real
// sign-in (phone OTP) would replace this before any real farmer data is stored.

const DATABASE = (import.meta.env.VITE_DATABASE as string | undefined)?.trim().toLowerCase();
const URL_ = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, "");
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const API = ((import.meta.env.VITE_API_URL as string | undefined) || "/api").replace(/\/$/, "");
const WS_KEY = "agricluster:workspace";

const provider: "mongodb" | "supabase" | null = (() => {
  // The MongoDB API is served by the site itself, so it needs an http(s) page (not a double-clicked file).
  if (DATABASE === "mongodb") return location.protocol.startsWith("http") ? "mongodb" : null;
  if (DATABASE && DATABASE !== "supabase") return null;
  // Anything that isn't an http(s) URL (for example "off") disables Supabase.
  return URL_ && KEY && /^https?:\/\//.test(URL_) ? "supabase" : null;
})();

/** Cloud storage is configured, and we are not inside an embedding host (which blocks outside requests). */
export const cloudConfigured = (() => {
  if (!provider) return false;
  try {
    return window.self === window.top;
  } catch {
    return false;
  }
})();

/** The database's name, for Profile → "Where your data is saved" and the privacy page. */
export const databaseName = provider === "mongodb" ? "MongoDB Atlas" : provider === "supabase" ? "Supabase (PostgreSQL)" : "our database provider";
export const cloudHost = !cloudConfigured ? undefined : provider === "mongodb" ? new URL(API, location.href).host : new URL(URL_!).host;

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

// Which demo space the browser's local copy belongs to.
const LOCAL_WS_KEY = "agricluster:local-copy-space";
export function setLocalCopySpace(ws: string) {
  try {
    localStorage.setItem(LOCAL_WS_KEY, ws);
  } catch {
    /* storage unavailable */
  }
}
export function localCopyIsFor(ws: string): boolean {
  try {
    return localStorage.getItem(LOCAL_WS_KEY) === ws;
  } catch {
    return false;
  }
}

// A flag per space: this device has changes the database hasn't confirmed yet.
const pendingKey = (ws: string) => `agricluster:pending:${ws}`;
export function markPendingChanges(ws: string, pending: boolean) {
  try {
    if (pending) localStorage.setItem(pendingKey(ws), "1");
    else localStorage.removeItem(pendingKey(ws));
  } catch {
    /* storage unavailable */
  }
}
export function hasPendingChanges(ws: string): boolean {
  try {
    return localStorage.getItem(pendingKey(ws)) === "1";
  } catch {
    return false;
  }
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

/** The MongoDB API (netlify/functions/api.mts). A 404 on load means the space was never saved. */
async function api(ws: string | null, path: string, init: RequestInit = {}): Promise<Response> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (ws) h["x-workspace-id"] = ws;
  const res = await fetch(`${API}/${path}`, { ...init, headers: h });
  if (!res.ok && res.status !== 404) throw new Error(`Database ${init.method ?? "GET"} ${path} → ${res.status} ${(await res.text()).slice(0, 200)}`);
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
  if (provider === "mongodb") {
    const res = await api(ws, "workspace");
    if (res.status === 404) return null;
    const body = (await res.json()) as { state: Record<string, unknown>; records: { collection: string; data: { id: string } }[] };
    const collections: Snapshot["collections"] = {};
    for (const r of body.records) (collections[r.collection] ??= []).push(r.data);
    return { settings: body.state ?? {}, collections };
  }
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
  const settingsChanged = !previous || fingerprint(previous.settings) !== fingerprint(next.settings);
  const upserts: { collection: string; id: string; position: number; data: { id: string } }[] = [];
  const deletes: { collection: string; ids: string[] }[] = [];
  for (const [collection, items] of Object.entries(next.collections)) {
    // New records are added at the front, so positions count from the end: adding
    // one record doesn't change the stored position of the others.
    const prevItems = previous?.collections[collection] ?? [];
    const before = new Map(prevItems.map((r, i) => [r.id, fingerprint(r) + "#" + (prevItems.length - i)]));
    items.forEach((r, i) => {
      const position = items.length - i;
      if (before.get(r.id) !== fingerprint(r) + "#" + position) upserts.push({ collection, id: r.id, position, data: r });
    });
    const gone = prevItems.map((r) => r.id).filter((id) => !items.some((r) => r.id === id));
    if (gone.length) deletes.push({ collection, ids: gone });
  }

  if (provider === "mongodb") {
    // Settings and deletions go with the first request; records in batches of 200.
    for (let i = 0; i === 0 || i < upserts.length; i += 200) {
      const first = i === 0;
      await api(ws, "workspace", {
        method: "POST",
        body: JSON.stringify({ settings: first && settingsChanged ? next.settings : undefined, upserts: upserts.slice(i, i + 200), deletes: first ? deletes : [] }),
      });
    }
    return next;
  }

  if (settingsChanged) {
    await call(ws, "workspaces?on_conflict=id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ id: ws, state: next.settings, updated_at: new Date().toISOString() }),
    });
  }
  for (const { collection, ids } of deletes) {
    const list = ids.map((id) => `"${id.replace(/"/g, "")}"`).join(",");
    await call(ws, `records?workspace_id=eq.${ws}&collection=eq.${collection}&id=in.(${encodeURIComponent(list)})`, { method: "DELETE" });
  }
  const now = new Date().toISOString();
  const rows = upserts.map((u) => ({ workspace_id: ws, ...u, updated_at: now }));
  for (let i = 0; i < rows.length; i += 200) {
    await call(ws, "records?on_conflict=workspace_id,collection,id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(rows.slice(i, i + 200)),
    });
  }
  return next;
}

export interface FeedbackRow {
  role: string;
  rating: number;
  ease: number | null;
  usefulness: number | null;
  features: string[];
  experience: string | null;
  suggestions: string | null;
  contact_email: string | null;
  source: string;
}

/**
 * Send one anonymous feedback response (MongoDB `feedback` collection, or
 * supabase/feedback.sql). No demo-space id or sign-in details are sent.
 * Insert-only: the website can't read responses back.
 */
export async function sendFeedback(row: FeedbackRow): Promise<void> {
  if (provider === "mongodb") {
    const res = await api(null, "feedback", { method: "POST", body: JSON.stringify(row) });
    if (!res.ok) throw new Error(`Feedback not saved (${res.status})`);
    return;
  }
  const h: Record<string, string> = { apikey: KEY!, "Content-Type": "application/json", Prefer: "return=minimal" };
  if (!KEY!.startsWith("sb_")) h.Authorization = `Bearer ${KEY}`;
  const res = await fetch(`${URL_}/rest/v1/feedback`, { method: "POST", headers: h, body: JSON.stringify(row) });
  if (!res.ok) throw new Error(`Feedback not saved (${res.status}) ${(await res.text()).slice(0, 160)}`);
}

/** Delete a workspace and all its records (records cascade). */
export async function deleteWorkspace(ws: string): Promise<void> {
  if (provider === "mongodb") {
    await api(ws, "workspace", { method: "DELETE" });
    return;
  }
  await call(ws, `workspaces?id=eq.${ws}`, { method: "DELETE" });
}

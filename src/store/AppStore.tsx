import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import {
  cloudConfigured,
  currentWorkspaceId,
  hasPendingChanges,
  loadWorkspace,
  localCopyIsFor,
  setLocalCopySpace,
  markPendingChanges,
  saveWorkspace,
  startNewWorkspace,
  type Snapshot,
} from "../services/storage/cloud";
import type {
  AppNotification,
  Booking,
  CommunityEvent,
  CommunityGroup,
  SupportRequest,
  FarmPlan,
  BuyerRequirement,
  CommunityPost,
  CommunityReply,
  Consultation,
  CropListing,
  Decision,
  DecisionStatus,
  Expert,
  FarmerProfile,
  LabourProfile,
  LabourRequest,
  Machinery,
  MarketInterest,
  Role,
  ServiceRequest,
  Technology,
} from "../types";
import { isRealMode, setRealMembers, setRealMode } from "../services/mode";
import { insertItem, loadReal, patchItem, saveUserState } from "../services/storage/realData";
import { accessFor, CLUSTER_OFFICE } from "../features/accounts/access";
import { demoUserForRole, farmers } from "../data/mock/users";
import { DEMO_NOW } from "../data/mock/clock";
import {
  seedBookings,
  seedConsultations,
  seedLabourRequests,
  seedListings,
  seedNotifications,
  seedPosts,
  seedReplies,
} from "../data/mock/activity";
import { seedEvents, seedGroups, seedSupportRequests } from "../data/mock/community";
import { onAdd, onUpdate, type NewNotification } from "../features/notifications/rules";

// Client-side state for the prototype: the simulated session and every record
// people create or change during a demo. Roles share these records — a farmer's
// booking is what the machinery owner accepts, a farmer's listing is what a
// buyer sees — which is what makes the cluster feel connected. Persisted to
// localStorage; "Reset demo" restores the seeded starting point.

export interface Session {
  userId: string;
  role: Role;
  name: string;
  /** "real": signed in with a phone number (services/auth/accounts.ts). Otherwise a demo role. */
  mode?: "demo" | "real";
}

export interface Collections {
  listings: CropListing[];
  bookings: Booking[];
  labourRequests: LabourRequest[];
  serviceRequests: ServiceRequest[];
  consultations: Consultation[];
  interests: MarketInterest[];
  requirements: BuyerRequirement[];
  equipment: Machinery[];
  posts: CommunityPost[];
  replies: CommunityReply[];
  notifications: AppNotification[];
  groups: CommunityGroup[];
  events: CommunityEvent[];
  supportRequests: SupportRequest[];
  /** Real accounts only: labour crews, expert profiles and technology offerings people publish. */
  crews: LabourProfile[];
  experts: Expert[];
  technologies: Technology[];
}
export type CollectionKey = keyof Collections;
type Item<K extends CollectionKey> = Collections[K][number];

/** Collections stored as one database row per record (see services/storage/cloud.ts). */
export const COLLECTION_KEYS: CollectionKey[] = [
  "listings",
  "bookings",
  "labourRequests",
  "serviceRequests",
  "consultations",
  "interests",
  "requirements",
  "equipment",
  "posts",
  "replies",
  "notifications",
  "groups",
  "events",
  "supportRequests",
];

/** Every collection a real account loads and saves (supabase/shared-data.sql item_rules). */
export const ALL_COLLECTION_KEYS: CollectionKey[] = [...COLLECTION_KEYS, "crews", "experts", "technologies"];

/** Private per-person data (user_state for real accounts). */
const SETTINGS_KEYS = ["decisions", "farmerProfile", "machineryEdits", "labourEdits", "plan", "savedListings", "savedResources"] as const;
const pickSettings = (s: State) => Object.fromEntries(SETTINGS_KEYS.map((k) => [k, s[k]]));

/** Is this notification for the signed-in person (or their whole role, for the cluster office)? */
export const isForMe = (n: AppNotification, session: Session | null) =>
  !!session && (n.userId === session.userId || (session.role === "cluster" && (n.userId === CLUSTER_OFFICE || n.userId === "role:cluster")));

export interface StorageStatus {
  mode: "cloud" | "local";
  status: "connecting" | "saving" | "saved" | "offline" | "local";
  workspaceId: string;
  savedAt?: string;
  error?: string;
}

export interface State extends Collections {
  session: Session | null;
  decisions: Record<string, Decision>;
  farmerProfile: FarmerProfile;
  /** Owner edits to demo machinery (availability, rate, status). */
  machineryEdits: Record<string, Partial<Machinery>>;
  /** Labour profile edits (skills, availability, location). */
  labourEdits: Record<string, Partial<LabourProfile>>;
  /** The farmer's decision journey: assessment → vision → crop → method → budget. */
  plan: FarmPlan;
  /** Listing ids a buyer saved. */
  savedListings: string[];
  /** Machinery and technology offering keys a farmer saved. */
  savedResources: string[];
}

type Action =
  | { type: "signIn"; session: Session; newFarmer?: boolean }
  | { type: "signOut"; restore?: State }
  | { type: "decide"; recommendationId: string; status: DecisionStatus }
  | { type: "undoDecision"; recommendationId: string }
  | { type: "updateProfile"; patch: Partial<FarmerProfile> }
  | { type: "add"; key: CollectionKey; record: { id: string } }
  | { type: "update"; key: CollectionKey; id: string; patch: object }
  | { type: "editMachinery"; id: string; patch: Partial<Machinery> }
  | { type: "editLabour"; id: string; patch: Partial<LabourProfile> }
  | { type: "updatePlan"; patch: Partial<FarmPlan> }
  | { type: "resetPlan" }
  | { type: "markAllRead"; ids: string[] }
  | { type: "toggleSaved"; listingId: string }
  | { type: "toggleSavedResource"; key: string }
  | { type: "hydrate"; state: State }
  | { type: "hydrateReal"; collections: Partial<Collections>; settings: Record<string, unknown> | null }
  | { type: "reset" };

const STORAGE_KEY = "agricluster:v5";

const demoFarmer = farmers[0];
const demoProfile: FarmerProfile = {
  objective: demoFarmer.objective,
  method: demoFarmer.method,
  onboarded: true,
  showNameToBuyers: false,
};

const initialState: State = {
  session: null,
  decisions: {},
  farmerProfile: demoProfile,
  listings: seedListings,
  bookings: seedBookings,
  labourRequests: seedLabourRequests,
  serviceRequests: [],
  consultations: seedConsultations,
  interests: [],
  requirements: [],
  equipment: [],
  posts: seedPosts,
  replies: seedReplies,
  notifications: seedNotifications,
  groups: seedGroups,
  events: seedEvents,
  supportRequests: seedSupportRequests,
  crews: [],
  experts: [],
  technologies: [],
  machineryEdits: {},
  labourEdits: {},
  plan: {},
  savedListings: [],
  savedResources: [],
};

/** A real account starts empty: only real people's records, loaded from the database. */
const realInitialState: State = {
  ...initialState,
  ...(Object.fromEntries(ALL_COLLECTION_KEYS.map((k) => [k, []])) as unknown as Collections),
  farmerProfile: { ...demoProfile, onboarded: false },
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "signIn": {
      if (action.session.mode === "real") {
        // Same person (name or role refreshed): keep their data; otherwise start clean.
        if (state.session?.mode === "real" && state.session.userId === action.session.userId) return { ...state, session: action.session };
        return { ...realInitialState, session: action.session };
      }
      const farmerProfile = action.newFarmer
        ? { ...demoProfile, onboarded: false }
        : action.session.role === "farmer" && !state.farmerProfile.onboarded
          ? demoProfile
          : state.farmerProfile;
      return { ...state, session: action.session, farmerProfile };
    }
    case "signOut":
      return { ...(action.restore ?? state), session: null };
    case "decide":
      return {
        ...state,
        decisions: {
          ...state.decisions,
          [action.recommendationId]: { recommendationId: action.recommendationId, status: action.status, at: DEMO_NOW.toISOString() },
        },
      };
    case "undoDecision": {
      const decisions = { ...state.decisions };
      delete decisions[action.recommendationId];
      return { ...state, decisions };
    }
    case "updateProfile":
      return { ...state, farmerProfile: { ...state.farmerProfile, ...action.patch } };
    case "add":
      return { ...state, [action.key]: [action.record, ...(state[action.key] as { id: string }[])] };
    case "update":
      return {
        ...state,
        [action.key]: (state[action.key] as { id: string }[]).map((r) => (r.id === action.id ? { ...r, ...action.patch } : r)),
      };
    case "editMachinery":
      return { ...state, machineryEdits: { ...state.machineryEdits, [action.id]: { ...state.machineryEdits[action.id], ...action.patch } } };
    case "editLabour":
      return { ...state, labourEdits: { ...state.labourEdits, [action.id]: { ...state.labourEdits[action.id], ...action.patch } } };
    case "updatePlan":
      return { ...state, plan: { ...state.plan, ...action.patch } };
    case "resetPlan":
      return { ...state, plan: {} };
    case "markAllRead":
      return { ...state, notifications: state.notifications.map((n) => (action.ids.includes(n.id) ? { ...n, read: true } : n)) };
    case "toggleSaved":
      return {
        ...state,
        savedListings: state.savedListings.includes(action.listingId)
          ? state.savedListings.filter((id) => id !== action.listingId)
          : [...state.savedListings, action.listingId],
      };
    case "toggleSavedResource":
      return {
        ...state,
        savedResources: state.savedResources.includes(action.key)
          ? state.savedResources.filter((k) => k !== action.key)
          : [...state.savedResources, action.key],
      };
    case "hydrate":
      // Data loaded from the database; who is signed in stays per device.
      return { ...action.state, session: state.session };
    case "hydrateReal":
      return {
        ...state,
        ...action.collections,
        ...(action.settings ? Object.fromEntries(SETTINGS_KEYS.filter((k) => k in action.settings!).map((k) => [k, action.settings![k]])) : {}),
      };
    case "reset":
      return initialState;
  }
}

// ---------------------------------------------------------------------------
// Database snapshots: settings in one row, each collection record in its own row.

function toSnapshot(s: State): Snapshot {
  const settings: Record<string, unknown> = { __collections: COLLECTION_KEYS };
  const collections: Snapshot["collections"] = {};
  for (const [k, v] of Object.entries(s)) {
    if (k === "session") continue;
    if ((COLLECTION_KEYS as string[]).includes(k)) collections[k] = v as { id: string }[];
    else settings[k] = v;
  }
  return { settings, collections };
}

function fromSnapshot(snap: Snapshot): State {
  const { __collections, ...settings } = snap.settings as { __collections?: string[] } & Record<string, unknown>;
  const collections: Record<string, unknown> = {};
  // A collection the space saved but that now has no rows is empty, not "use the seeds".
  for (const k of __collections ?? []) collections[k] = snap.collections[k] ?? [];
  return { ...initialState, ...settings, ...collections, session: null } as State;
}

function loadState(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...initialState, ...(JSON.parse(raw) as Partial<State>) } : initialState;
  } catch {
    return initialState;
  }
}

/** Id + timestamp for a new record (timestamps follow the demo clock). */
const meta = (prefix: string) => ({
  id: `${prefix}-${Math.random().toString(36).slice(2, isRealMode() ? 12 : 8)}`,
  createdAt: (isRealMode() ? new Date() : DEMO_NOW).toISOString(),
});

type NewRecord<T> = Omit<T, "id" | "createdAt" | "status">;

interface AppStore extends State {
  signInAsDemo: (role: Role) => Session;
  signUp: (role: Role, name: string) => Session;
  /** A real account finished signing in (features/accounts/AccountProvider.tsx). */
  signInReal: (session: Omit<Session, "mode">) => void;
  signOut: () => void;
  decide: (recommendationId: string, status: DecisionStatus) => void;
  undoDecision: (recommendationId: string) => void;
  updateProfile: (patch: Partial<FarmerProfile>) => void;
  /** Patch any record in a shared collection. */
  update: <K extends CollectionKey>(key: K, id: string, patch: Partial<Item<K>>) => void;
  editMachinery: (id: string, patch: Partial<Machinery>) => void;
  editLabour: (id: string, patch: Partial<LabourProfile>) => void;
  updatePlan: (patch: Partial<FarmPlan>) => void;
  resetPlan: () => void;
  /** Send a notification to a user. */
  notify: (n: Omit<AppNotification, "id" | "createdAt" | "read">) => void;
  markRead: (id: string) => void;
  markAllRead: (userId: string) => void;
  toggleSaved: (listingId: string) => void;
  toggleSavedResource: (key: string) => void;
  addListing: (listing: NewRecord<CropListing>) => CropListing;
  addBooking: (booking: NewRecord<Booking>) => Booking;
  addLabourRequest: (request: NewRecord<LabourRequest>) => LabourRequest;
  addServiceRequest: (request: NewRecord<ServiceRequest>) => ServiceRequest;
  addConsultation: (request: NewRecord<Consultation>) => Consultation;
  addInterest: (interest: NewRecord<MarketInterest>) => MarketInterest;
  addRequirement: (req: Omit<BuyerRequirement, "id" | "postedAt" | "status">) => BuyerRequirement;
  addEquipment: (m: Omit<Machinery, "id">) => Machinery;
  addPost: (post: Omit<CommunityPost, "id" | "createdAt">) => CommunityPost;
  addReply: (reply: Omit<CommunityReply, "id" | "createdAt">) => CommunityReply;
  addGroup: (group: Omit<CommunityGroup, "id" | "createdAt">) => CommunityGroup;
  addEvent: (event: Omit<CommunityEvent, "id" | "createdAt">) => CommunityEvent;
  addSupportRequest: (request: NewRecord<SupportRequest>) => SupportRequest;
  /** Real accounts: an expert publishes their profile; a labour crew its crew profile. */
  addExpertProfile: (expert: Omit<Expert, "id">) => Expert;
  addCrew: (crew: Omit<LabourProfile, "id">) => LabourProfile;
  /** Farmer accepts a buyer's interest: the listing is agreed with that buyer; other interests are declined. */
  acceptInterest: (interest: MarketInterest) => void;
  /** Buyer accepts a farmer's offer on their requirement. */
  acceptOffer: (listing: CropListing, buyer: { userId: string; label: string }) => void;
  declineOffer: (listing: CropListing, buyerLabel: string) => void;
  resetDemo: () => void;
  /** Where the data is saved, and whether the last save worked. */
  storage: StorageStatus;
  /** Start a fresh demo space in the database (the old one stays reachable by its share link). */
  newDemoSpace: () => void;
  /** Try connecting to the database again after being offline. */
  retryStorage: () => void;
}

const AppStoreContext = createContext<AppStore | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  const real = state.session?.mode === "real";
  // Non-React modules (labels, clock, data API) follow the signed-in world.
  if (isRealMode() !== real) setRealMode(real);
  const realRef = useRef(real);
  realRef.current = real;

  useEffect(() => {
    // The browser copy is the demo's. A real account's data lives in the database only.
    if (real) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage unavailable (private mode, quota) — the demo still works in memory.
    }
  }, [state, real]);

  // ---- Cloud database (MongoDB or Supabase, see services/storage/cloud.ts). The browser copy above stays as an offline fallback.
  const wsRef = useRef(cloudConfigured ? currentWorkspaceId() : "");
  const lastSaved = useRef<Snapshot | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const busy = useRef(false);
  const hydrating = useRef(false);
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [storage, setStorage] = useState<StorageStatus>({
    mode: cloudConfigured ? "cloud" : "local",
    status: cloudConfigured ? "connecting" : "local",
    workspaceId: wsRef.current,
  });

  // Load this browser's demo space.
  useEffect(() => {
    if (!cloudConfigured) return;
    let cancelled = false;
    setReady(false);
    setStorage((s) => ({ ...s, status: "connecting", workspaceId: wsRef.current, error: undefined }));
    loadWorkspace(wsRef.current)
      .then((remote) => {
        if (cancelled) return;
        lastSaved.current = remote;
        // Changes made on this device that never reached the database (for example
        // the tab was closed or reloaded right after a change) win: keep them and
        // send them. Otherwise the database copy is newer (maybe from another device).
        const keepLocal = hasPendingChanges(wsRef.current) && localCopyIsFor(wsRef.current);
        if (remote && !keepLocal && !realRef.current) {
          hydrating.current = true;
          dispatch({ type: "hydrate", state: fromSnapshot(remote) });
        }
        // From now on the browser copy belongs to this space.
        setLocalCopySpace(wsRef.current);
        setReady(true);
      })
      .catch((e: Error) => !cancelled && setStorage((s) => ({ ...s, status: "offline", error: e.message })));
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  // Save changes shortly after they happen, one save at a time, only what changed.
  const changeSeq = useRef(0);
  useEffect(() => {
    if (!cloudConfigured || !ready || real) return;
    // Remember on this device that there are changes not yet in the database
    // (not for data that just came from the database).
    const seq = ++changeSeq.current;
    if (hydrating.current) hydrating.current = false;
    else markPendingChanges(wsRef.current, true);
    const t = setTimeout(() => {
      const snap = toSnapshot(state);
      const ws = wsRef.current;
      queue.current = queue.current.then(async () => {
        busy.current = true;
        setStorage((s) => ({ ...s, status: "saving" }));
        try {
          lastSaved.current = await saveWorkspace(ws, snap, lastSaved.current);
          if (seq === changeSeq.current && ws === wsRef.current) markPendingChanges(ws, false);
          setStorage((s) => ({ ...s, status: "saved", savedAt: new Date().toISOString(), error: undefined }));
        } catch (e) {
          setStorage((s) => ({ ...s, status: "offline", error: (e as Error).message }));
        } finally {
          busy.current = false;
        }
      });
    }, 600);
    return () => clearTimeout(t);
  }, [state, ready, real]);

  // Coming back to the tab: pick up changes made on another device with the share link.
  useEffect(() => {
    if (!cloudConfigured) return;
    const onFocus = () => {
      if (!ready || busy.current || hasPendingChanges(wsRef.current) || realRef.current) return;
      loadWorkspace(wsRef.current)
        .then((remote) => {
          if (!remote || busy.current || hasPendingChanges(wsRef.current) || realRef.current) return;
          if (JSON.stringify(remote) === JSON.stringify(lastSaved.current)) return;
          lastSaved.current = remote;
          dispatch({ type: "hydrate", state: fromSnapshot(remote) });
        })
        .catch(() => undefined);
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [ready]);

  const newDemoSpace = useCallback(() => {
    if (!cloudConfigured) {
      dispatch({ type: "reset" });
      return;
    }
    wsRef.current = startNewWorkspace();
    lastSaved.current = null;
    dispatch({ type: "reset" });
    setAttempt((a) => a + 1);
  }, []);
  const retryStorage = useCallback(() => (isRealMode() ? setRealAttempt((a) => a + 1) : setAttempt((a) => a + 1)), []);

  const signInAsDemo = useCallback((role: Role) => {
    const user = demoUserForRole(role);
    const session: Session = { userId: user.id, role, name: user.name, mode: "demo" };
    dispatch({ type: "signIn", session });
    return session;
  }, []);

  const signInReal = useCallback((s: Omit<Session, "mode">) => {
    // Leave the demo copy signed out, so a reload never shows a demo role to a real account.
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...(JSON.parse(raw) as object), session: null }));
    } catch {
      /* storage unavailable */
    }
    dispatch({ type: "signIn", session: { ...s, mode: "real" } });
  }, []);

  // ---- Real accounts: shared records and private settings in the database (services/storage/realData.ts).
  const realUser = real ? state.session!.userId : null;
  const owners = useRef(new Map<string, string>());
  const pendingWrites = useRef(0);
  const realQueue = useRef<Promise<void>>(Promise.resolve());
  const settingsReady = useRef(false);
  const lastSettings = useRef("");
  const [realAttempt, setRealAttempt] = useState(0);

  const write = useCallback((fn: () => Promise<void>) => {
    pendingWrites.current++;
    setStorage((s) => ({ ...s, mode: "cloud", status: "saving" }));
    realQueue.current = realQueue.current
      .then(fn)
      .then(() => setStorage((s) => ({ ...s, status: "saved", savedAt: new Date().toISOString(), error: undefined })))
      .catch((e: Error) => setStorage((s) => ({ ...s, status: "offline", error: e.message })))
      .finally(() => {
        pendingWrites.current--;
      });
  }, []);

  useEffect(() => {
    if (!realUser) {
      settingsReady.current = false;
      return;
    }
    let cancelled = false;
    let first = true;
    setStorage((s) => ({ ...s, mode: "cloud", status: "connecting", error: undefined }));
    const load = () => {
      // Never replace what is on screen while this device still has changes on the way.
      if (pendingWrites.current > 0) return;
      loadReal(realUser)
        .then((snap) => {
          if (cancelled || pendingWrites.current > 0) return;
          owners.current = new Map(snap.items.map((i) => [`${i.collection}:${i.id}`, i.owner]));
          setRealMembers(snap.members);
          const collections = Object.fromEntries(ALL_COLLECTION_KEYS.map((k) => [k, [] as { id: string }[]])) as Record<string, { id: string }[]>;
          for (const i of snap.items) collections[i.collection]?.push(i.data);
          const settings = first ? snap.state : null;
          if (first) {
            lastSettings.current = JSON.stringify(pickSettings({ ...realInitialState, ...(snap.state ?? {}) } as State));
            settingsReady.current = true;
            first = false;
          }
          dispatch({ type: "hydrateReal", collections: collections as unknown as Partial<Collections>, settings });
          setStorage((s) => ({ ...s, mode: "cloud", status: "saved", savedAt: new Date().toISOString(), error: undefined }));
        })
        .catch((e: Error) => !cancelled && setStorage((s) => ({ ...s, mode: "cloud", status: "offline", error: e.message })));
    };
    load();
    // Other people's changes (a reply, an approval, a new listing) arrive within a minute, or on return to the tab.
    const timer = setInterval(load, 30_000);
    window.addEventListener("focus", load);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener("focus", load);
    };
  }, [realUser, realAttempt]);

  // Private settings (plan, profile, decisions, saved items): saved shortly after they change.
  const settingsJson = real ? JSON.stringify(pickSettings(state)) : "";
  useEffect(() => {
    if (!realUser || !settingsReady.current || settingsJson === lastSettings.current) return;
    const t = setTimeout(() => {
      lastSettings.current = settingsJson;
      write(() => saveUserState(realUser, JSON.parse(settingsJson) as Record<string, unknown>));
    }, 800);
    return () => clearTimeout(t);
  }, [settingsJson, realUser, write]);

  const ownerOf = useCallback((collection: string, id: string) => owners.current.get(`${collection}:${id}`), []);

  // Simulated sign-up: new accounts reuse the role's demo profile data so every
  // screen has coherent content, but keep the name the person entered.
  const signUp = useCallback((role: Role, name: string) => {
    const user = demoUserForRole(role);
    const session: Session = { userId: user.id, role, name: name.trim() || user.name, mode: "demo" };
    dispatch({ type: "signIn", session, newFarmer: role === "farmer" });
    return session;
  }, []);

  const value = useMemo<AppStore>(() => {
    // Cross-role notifications (Phase 4): the rules decide who hears about a new
    // record or a status change; nobody is notified about their own action.
    // Real accounts: every change also goes to the database, shared as access.ts decides.
    const save = <K extends CollectionKey>(key: K, record: Item<K>) => {
      if (!real) return;
      owners.current.set(`${key}:${record.id}`, state.session!.userId);
      const { viewers, editors } = accessFor(key, record as unknown as Record<string, unknown>, state, ownerOf);
      write(() => insertItem(key, record, viewers, editors));
    };
    const send = (list: NewNotification[]) =>
      list
        .filter((n) => n.userId !== state.session?.userId && !(real && isForMe(n as AppNotification, state.session)))
        .forEach((n) => {
          const record: AppNotification = { ...n, ...meta("ntf"), read: false };
          dispatch({ type: "add", key: "notifications", record });
          save("notifications", record);
        });
    const add = <K extends CollectionKey>(key: K, record: Item<K>) => {
      dispatch({ type: "add", key, record });
      save(key, record);
      if (key !== "notifications") send(onAdd(key, record, state));
      return record;
    };
    const update = <K extends CollectionKey>(key: K, id: string, patch: Partial<Item<K>>) => {
      const before = (state[key] as { id: string }[]).find((r) => r.id === id);
      dispatch({ type: "update", key, id, patch });
      if (real) write(() => patchItem(key, id, patch as Record<string, unknown>));
      if (key !== "notifications") send(onUpdate(key, before, patch as Record<string, unknown>, state));
    };

    return {
      ...state,
      signInAsDemo,
      signUp,
      signInReal,
      // Leaving a real account brings back this browser's demo copy.
      signOut: () => dispatch({ type: "signOut", restore: real ? { ...loadState(), session: null } : undefined }),
      decide: (recommendationId, status) => dispatch({ type: "decide", recommendationId, status }),
      undoDecision: (recommendationId) => dispatch({ type: "undoDecision", recommendationId }),
      updateProfile: (patch) => dispatch({ type: "updateProfile", patch }),
      update,
      // Real accounts edit their own published records; the demo layers edits over sample data.
      editMachinery: (id, patch) => (real ? update("equipment", id, patch) : dispatch({ type: "editMachinery", id, patch })),
      editLabour: (id, patch) => (real ? update("crews", id, patch) : dispatch({ type: "editLabour", id, patch })),
      updatePlan: (patch) => dispatch({ type: "updatePlan", patch }),
      resetPlan: () => dispatch({ type: "resetPlan" }),
      notify: (n) => add("notifications", { ...n, ...meta("ntf"), read: false }),
      markRead: (id) => update("notifications", id, { read: true }),
      markAllRead: () => {
        const ids = state.notifications.filter((n) => !n.read && isForMe(n, state.session)).map((n) => n.id);
        dispatch({ type: "markAllRead", ids });
        if (real) ids.forEach((id) => write(() => patchItem("notifications", id, { read: true })));
      },
      toggleSaved: (listingId) => dispatch({ type: "toggleSaved", listingId }),
      toggleSavedResource: (key) => dispatch({ type: "toggleSavedResource", key }),
      addListing: (input) => add("listings", { ...input, ...meta("lst"), status: input.requirementId ? "offer-sent" : "listed" }),
      addBooking: (input) => add("bookings", { ...input, ...meta("bk"), status: "requested" }),
      addLabourRequest: (input) => add("labourRequests", { ...input, ...meta("lr"), status: "requested" }),
      addServiceRequest: (input) => add("serviceRequests", { ...input, ...meta("sr"), status: "requested" }),
      addConsultation: (input) => add("consultations", { ...input, ...meta("cn"), status: "sent" }),
      addInterest: (input) => {
        const record = add("interests", { ...input, ...meta("int"), status: "pending" });
        update("listings", input.listingId, { status: "interest-received" });
        return record;
      },
      addRequirement: (input) => {
        const { id, createdAt } = meta("br");
        return add("requirements", { ...input, id, postedAt: createdAt, status: "open" });
      },
      addEquipment: (input) => add("equipment", { ...input, id: meta("eq").id }),
      addPost: (input) => add("posts", { ...input, ...meta("post") }),
      addReply: (input) => add("replies", { ...input, ...meta("rep") }),
      addGroup: (input) => add("groups", { ...input, ...meta("grp") }),
      addEvent: (input) => add("events", { ...input, ...meta("evt") }),
      addSupportRequest: (input) => add("supportRequests", { ...input, ...meta("sup"), status: "requested" }),
      addExpertProfile: (input) => add("experts", { ...input, id: meta("ex").id }),
      addCrew: (input) => add("crews", { ...input, id: meta("crew").id }),
      acceptInterest: (interest) => {
        state.interests
          .filter((i) => i.listingId === interest.listingId && i.id !== interest.id && i.status === "pending")
          .forEach((i) => update("interests", i.id, { status: "declined" }));
        update("interests", interest.id, { status: "accepted" });
        update("listings", interest.listingId, {
          status: "agreed",
          agreedWith: {
            buyerUserId: interest.buyerUserId,
            buyerLabel: interest.buyerLabel,
            pricePerKg: interest.pricePerKg,
            quantityTonnes: interest.quantityTonnes,
          },
        });
      },
      acceptOffer: (listing, buyer) =>
        update("listings", listing.id, {
          status: "agreed",
          agreedWith: { buyerUserId: buyer.userId, buyerLabel: buyer.label, pricePerKg: listing.expectedPricePerKg, quantityTonnes: listing.quantityTonnes },
        }),
      declineOffer: (listing, buyerLabel) =>
        update("listings", listing.id, { status: "listed", requirementId: undefined, offerDeclinedBy: buyerLabel }),
      resetDemo: () => dispatch({ type: "reset" }),
      storage,
      newDemoSpace,
      retryStorage,
    };
  }, [state, real, write, ownerOf, signInAsDemo, signUp, signInReal, storage, newDemoSpace, retryStorage]);

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore(): AppStore {
  const store = useContext(AppStoreContext);
  if (!store) throw new Error("useAppStore must be used inside <AppStoreProvider>");
  return store;
}

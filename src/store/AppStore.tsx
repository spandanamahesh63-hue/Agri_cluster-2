import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import type {
  Booking,
  BuyerRequirement,
  CommunityPost,
  CommunityReply,
  Consultation,
  CropListing,
  Decision,
  DecisionStatus,
  FarmerProfile,
  LabourProfile,
  LabourRequest,
  Machinery,
  MarketInterest,
  Role,
  ServiceRequest,
} from "../types";
import { demoUserForRole, farmers } from "../data/mock/users";
import { DEMO_NOW } from "../data/mock/clock";
import { seedBookings, seedConsultations, seedLabourRequests, seedListings, seedPosts, seedReplies } from "../data/mock/activity";

// Client-side state for the prototype: the simulated session and every record
// people create or change during a demo. Roles share these records — a farmer's
// booking is what the machinery owner accepts, a farmer's listing is what a
// buyer sees — which is what makes the cluster feel connected. Persisted to
// localStorage; "Reset demo" restores the seeded starting point.

export interface Session {
  userId: string;
  role: Role;
  name: string;
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
}
export type CollectionKey = keyof Collections;
type Item<K extends CollectionKey> = Collections[K][number];

export interface State extends Collections {
  session: Session | null;
  decisions: Record<string, Decision>;
  farmerProfile: FarmerProfile;
  /** Owner edits to demo machinery (availability, rate, status). */
  machineryEdits: Record<string, Partial<Machinery>>;
  /** Labour profile edits (skills, availability, location). */
  labourEdits: Record<string, Partial<LabourProfile>>;
}

type Action =
  | { type: "signIn"; session: Session; newFarmer?: boolean }
  | { type: "signOut" }
  | { type: "decide"; recommendationId: string; status: DecisionStatus }
  | { type: "undoDecision"; recommendationId: string }
  | { type: "updateProfile"; patch: Partial<FarmerProfile> }
  | { type: "add"; key: CollectionKey; record: { id: string } }
  | { type: "update"; key: CollectionKey; id: string; patch: object }
  | { type: "editMachinery"; id: string; patch: Partial<Machinery> }
  | { type: "editLabour"; id: string; patch: Partial<LabourProfile> }
  | { type: "reset" };

const STORAGE_KEY = "agricluster:v3";

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
  machineryEdits: {},
  labourEdits: {},
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "signIn": {
      const farmerProfile = action.newFarmer
        ? { ...demoProfile, onboarded: false }
        : action.session.role === "farmer" && !state.farmerProfile.onboarded
          ? demoProfile
          : state.farmerProfile;
      return { ...state, session: action.session, farmerProfile };
    }
    case "signOut":
      return { ...state, session: null };
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
    case "reset":
      return initialState;
  }
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
  id: `${prefix}-${Math.random().toString(36).slice(2, 8)}`,
  createdAt: DEMO_NOW.toISOString(),
});

type NewRecord<T> = Omit<T, "id" | "createdAt" | "status">;

interface AppStore extends State {
  signInAsDemo: (role: Role) => Session;
  signUp: (role: Role, name: string) => Session;
  signOut: () => void;
  decide: (recommendationId: string, status: DecisionStatus) => void;
  undoDecision: (recommendationId: string) => void;
  updateProfile: (patch: Partial<FarmerProfile>) => void;
  /** Patch any record in a shared collection. */
  update: <K extends CollectionKey>(key: K, id: string, patch: Partial<Item<K>>) => void;
  editMachinery: (id: string, patch: Partial<Machinery>) => void;
  editLabour: (id: string, patch: Partial<LabourProfile>) => void;
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
  /** Farmer accepts a buyer's interest: the listing is agreed with that buyer; other interests are declined. */
  acceptInterest: (interest: MarketInterest) => void;
  /** Buyer accepts a farmer's offer on their requirement. */
  acceptOffer: (listing: CropListing, buyer: { userId: string; label: string }) => void;
  declineOffer: (listing: CropListing, buyerLabel: string) => void;
  resetDemo: () => void;
}

const AppStoreContext = createContext<AppStore | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage unavailable (private mode, quota) — the demo still works in memory.
    }
  }, [state]);

  const signInAsDemo = useCallback((role: Role) => {
    const user = demoUserForRole(role);
    const session = { userId: user.id, role, name: user.name };
    dispatch({ type: "signIn", session });
    return session;
  }, []);

  // Simulated sign-up: new accounts reuse the role's demo profile data so every
  // screen has coherent content, but keep the name the person entered.
  const signUp = useCallback((role: Role, name: string) => {
    const user = demoUserForRole(role);
    const session = { userId: user.id, role, name: name.trim() || user.name };
    dispatch({ type: "signIn", session, newFarmer: role === "farmer" });
    return session;
  }, []);

  const value = useMemo<AppStore>(() => {
    const add = <K extends CollectionKey>(key: K, record: Item<K>) => {
      dispatch({ type: "add", key, record });
      return record;
    };
    const update = <K extends CollectionKey>(key: K, id: string, patch: Partial<Item<K>>) => dispatch({ type: "update", key, id, patch });

    return {
      ...state,
      signInAsDemo,
      signUp,
      signOut: () => dispatch({ type: "signOut" }),
      decide: (recommendationId, status) => dispatch({ type: "decide", recommendationId, status }),
      undoDecision: (recommendationId) => dispatch({ type: "undoDecision", recommendationId }),
      updateProfile: (patch) => dispatch({ type: "updateProfile", patch }),
      update,
      editMachinery: (id, patch) => dispatch({ type: "editMachinery", id, patch }),
      editLabour: (id, patch) => dispatch({ type: "editLabour", id, patch }),
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
    };
  }, [state, signInAsDemo, signUp]);

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore(): AppStore {
  const store = useContext(AppStoreContext);
  if (!store) throw new Error("useAppStore must be used inside <AppStoreProvider>");
  return store;
}

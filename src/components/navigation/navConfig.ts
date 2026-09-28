import type { LucideIcon } from "lucide-react";
import {
  Brain,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  Droplets,
  GraduationCap,
  Handshake,
  HardHat,
  LayoutDashboard,
  Leaf,
  ListChecks,
  Map,
  MessagesSquare,
  Package,
  ShoppingBasket,
  Sprout,
  Store,
  Tractor,
  TrendingUp,
  UserRound,
  Users,
  Wheat,
  Zap,
} from "lucide-react";
import type { Role } from "../../types";

export interface NavItem {
  /** Path segment under /:role. "" is the role's home. */
  path: string;
  label: string;
  icon: LucideIcon;
  /** The one question this screen answers (spec §53). */
  question: string;
  /** Show in the mobile bottom bar (max 4 per role). */
  primary?: boolean;
}

export interface RoleMeta {
  role: Role;
  label: string;
  tagline: string;
  icon: LucideIcon;
  nav: NavItem[];
}

const community: NavItem = {
  path: "community",
  label: "Community",
  icon: MessagesSquare,
  question: "What is happening in my cluster, and who can answer my question?",
};

const profile: NavItem = { path: "profile", label: "Profile", icon: UserRound, question: "What does the cluster know about me?" };

export const roles: Record<Role, RoleMeta> = {
  farmer: {
    role: "farmer",
    label: "Farmer",
    tagline: "Daily decisions for your farm, backed by cluster intelligence.",
    icon: Sprout,
    nav: [
      { path: "", label: "Dashboard", icon: LayoutDashboard, question: "What needs my attention today?", primary: true },
      { path: "plan", label: "Plan", icon: ListChecks, question: "What should I grow, how, and with what investment?", primary: true },
      { path: "farm", label: "My Farm", icon: Map, question: "What is the state of my fields?" },
      { path: "intelligence", label: "Intelligence", icon: Brain, question: "What does the data suggest, and why?" },
      { path: "crops", label: "Crops", icon: Wheat, question: "How are my crops progressing?" },
      { path: "market", label: "Market", icon: TrendingUp, question: "Where can I sell my crop?", primary: true },
      { path: "resources", label: "Resources", icon: Tractor, question: "What equipment and labour are available?", primary: true },
      { path: "experts", label: "Experts", icon: GraduationCap, question: "Who can help me?" },
      community,
      profile,
    ],
  },
  cluster: {
    role: "cluster",
    label: "Cluster Manager",
    tagline: "Coordinate water, resources and markets across the cluster.",
    icon: LayoutDashboard,
    nav: [
      { path: "", label: "Overview", icon: LayoutDashboard, question: "What is happening across the cluster?", primary: true },
      { path: "farms", label: "Farms", icon: Map, question: "Where are the farms and what are they growing?" },
      { path: "intelligence", label: "Intelligence", icon: Brain, question: "Which alerts need coordination?", primary: true },
      { path: "water", label: "Water", icon: Droplets, question: "How is water being used across the cluster?" },
      { path: "energy", label: "Energy", icon: Zap, question: "When and how is pumping energy used?" },
      { path: "crops", label: "Crops", icon: Leaf, question: "How healthy are crops across the cluster?" },
      { path: "resources", label: "Resources", icon: Tractor, question: "Where does resource demand exceed supply?", primary: true },
      { path: "market", label: "Market", icon: TrendingUp, question: "How does expected supply compare with demand?" },
      { path: "impact", label: "Impact", icon: ListChecks, question: "Is the pilot moving towards its targets?", primary: true },
      community,
    ],
  },
  buyer: {
    role: "buyer",
    label: "Buyer",
    tagline: "Source produce from coordinated cluster supply.",
    icon: Store,
    nav: [
      { path: "", label: "Dashboard", icon: LayoutDashboard, question: "What supply is coming that matches my needs?", primary: true },
      { path: "requirements", label: "Requirements", icon: ClipboardList, question: "What am I looking to buy?", primary: true },
      { path: "supply", label: "Crop Supply", icon: ShoppingBasket, question: "What crops are available or expected?", primary: true },
      { path: "requests", label: "Requests", icon: MessagesSquare, question: "Which farmers have responded?" },
      { path: "deals", label: "Deals", icon: Handshake, question: "What have I agreed to buy?", primary: true },
      profile,
    ],
  },
  provider: {
    role: "provider",
    label: "Machinery / Tech Owner",
    tagline: "Rent equipment and technology to cluster farms.",
    icon: Tractor,
    nav: [
      { path: "", label: "Dashboard", icon: LayoutDashboard, question: "What requests and bookings need my attention?", primary: true },
      { path: "equipment", label: "Equipment", icon: Package, question: "What have I listed, and when is it available?", primary: true },
      { path: "bookings", label: "Bookings", icon: CalendarCheck, question: "Who is using my equipment, and when?", primary: true },
      community,
      profile,
    ],
  },
  labour: {
    role: "labour",
    label: "Labour",
    tagline: "Find farm work in the cluster that matches your skills.",
    icon: HardHat,
    nav: [
      { path: "", label: "Dashboard", icon: LayoutDashboard, question: "What work is available for me?", primary: true },
      { path: "jobs", label: "Work Requests", icon: ClipboardList, question: "Which farms need my skills?", primary: true },
      { path: "assignments", label: "Assignments", icon: CalendarCheck, question: "Where am I working, and when?", primary: true },
      community,
      profile,
    ],
  },
  community: {
    role: "community",
    label: "Community",
    tagline: "Run farmer groups, events and local knowledge sharing.",
    icon: Users,
    nav: [
      { path: "", label: "Dashboard", icon: LayoutDashboard, question: "What is happening in my farming community?", primary: true },
      { path: "groups", label: "Groups", icon: Users, question: "Which farmer groups am I running?", primary: true },
      { path: "events", label: "Events", icon: CalendarDays, question: "What workshops and meetings are coming up?", primary: true },
      { ...community, label: "Questions", question: "What are farmers asking, and who has answered?", primary: true },
      profile,
    ],
  },
  expert: {
    role: "expert",
    label: "Expert",
    tagline: "Support farmers with consultations and advice.",
    icon: GraduationCap,
    nav: [
      { path: "", label: "Dashboard", icon: LayoutDashboard, question: "Which farmers need my help?", primary: true },
      { path: "requests", label: "Requests", icon: MessagesSquare, question: "What have farmers asked?", primary: true },
      { path: "consultations", label: "Consultations", icon: CalendarCheck, question: "What sessions are coming up?", primary: true },
      community,
      profile,
    ],
  },
};

export const roleList: RoleMeta[] = [roles.farmer, roles.cluster, roles.buyer, roles.provider, roles.labour, roles.expert, roles.community];

export const roleHome = (role: Role) => `/${role}`;
export const navHref = (role: Role, item: NavItem) => (item.path ? `/${role}/${item.path}` : `/${role}`);

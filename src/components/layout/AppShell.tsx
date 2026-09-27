import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { Ellipsis, LogOut, Menu, Repeat, RotateCw, X } from "lucide-react";
import type { Role } from "../../types";
import { navHref, roles, type NavItem } from "../navigation/navConfig";
import { useAppStore } from "../../store/AppStore";
import { cluster } from "../../data/mock/cluster";
import { DEMO_NOW } from "../../data/mock/clock";
import { Logo } from "./Logo";
import { Badge } from "../ui/Badge";
import { PageSkeleton } from "../ui/states";
import { PageErrorBoundary } from "./PageErrorBoundary";
import { DemoGuideButton } from "../../features/demo/DemoGuide";

export function AppShell({ role }: { role: Role }) {
  const meta = roles[role];
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const location = useLocation();

  useEffect(closeDrawer, [location.pathname, closeDrawer]);

  // Page title follows the current section; focus moves to the new page so
  // keyboard and screen-reader users land at the start of the content.
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    const current = [...meta.nav]
      .sort((a, b) => b.path.length - a.path.length)
      .find((item) => location.pathname === navHref(role, item) || location.pathname.startsWith(`${navHref(role, item)}/`));
    document.title = `${current?.label ?? meta.label} · ${meta.label} · AgriCluster`;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    mainRef.current?.focus({ preventScroll: true });
  }, [location.pathname, meta, role]);

  return (
    <div className="min-h-dvh lg:pl-60">
      <a
        href="#main"
        onClick={(e) => {
          // Handled in script: in the single-file build the router uses the URL hash.
          e.preventDefault();
          mainRef.current?.focus();
        }}
        className="sr-only z-50 rounded-lg bg-ink px-4 py-2 text-sm text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-line bg-surface lg:flex">
        <div className="px-5 pb-4 pt-5">
          <Logo />
        </div>
        <ClusterChip />
        <nav aria-label={`${meta.label} navigation`} className="flex-1 overflow-y-auto px-3 py-3">
          <NavList role={role} items={meta.nav} />
        </nav>
        <AccountPanel role={role} />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-surface/95 px-4 backdrop-blur lg:hidden">
        <Logo subtitle={false} />
        <div className="flex items-center gap-1">
          <DemoGuideButton compact />
          <button
          type="button"
          aria-label="Open menu"
          aria-expanded={drawerOpen}
          className="grid size-9 place-items-center rounded-lg text-ink-muted hover:bg-sunken"
          onClick={() => setDrawerOpen(true)}
        >
          <Menu aria-hidden className="size-5" />
          </button>
        </div>
      </header>

      {/* Desktop context bar */}
      <div className="hidden h-12 items-center justify-between border-b border-line bg-surface px-8 lg:flex">
        <div className="text-[13px] text-ink-muted">
          <span className="font-medium text-ink">{meta.label}</span>
          <span className="mx-2 text-line-strong">/</span>
          {cluster.name}
        </div>
        <div className="flex items-center gap-4">
          <DemoClock />
          <DemoGuideButton />
        </div>
      </div>

      <main
        id="main"
        ref={mainRef}
        tabIndex={-1}
        className="mx-auto w-full max-w-6xl px-4 pb-28 pt-5 outline-none sm:px-6 lg:px-8 lg:pb-12 lg:pt-7"
      >
        <div className="mb-4 lg:hidden">
          <DemoClock />
        </div>
        <PageErrorBoundary resetKey={location.pathname}>
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </PageErrorBoundary>
      </main>

      <BottomBar role={role} onMore={() => setDrawerOpen(true)} />
      {drawerOpen && <Drawer role={role} onClose={closeDrawer} />}
    </div>
  );
}

function NavList({ role, items }: { role: Role; items: NavItem[] }) {
  return (
    <ul className="space-y-0.5">
      {items.map((item) => (
        <li key={item.path}>
          <NavLink
            to={navHref(role, item)}
            end={item.path === ""}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive ? "bg-brand-50 font-medium text-brand-800" : "text-ink-muted hover:bg-sunken hover:text-ink",
              )
            }
          >
            <item.icon aria-hidden className="size-4 shrink-0" />
            {item.label}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

function ClusterChip() {
  return (
    <div className="mx-3 rounded-lg border border-line bg-canvas px-3 py-2.5">
      <div className="text-[11px] font-medium uppercase tracking-wide text-ink-subtle">Cluster</div>
      <div className="text-[13px] font-medium text-ink">{cluster.name}</div>
      <div className="text-[12px] text-ink-muted">
        {cluster.farmerCount} farmers · {cluster.cultivatedAcres} acres
      </div>
    </div>
  );
}

function DemoClock() {
  const label = DEMO_NOW.toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
  return (
    <div className="flex flex-wrap items-center gap-2 text-[12px] text-ink-muted">
      <Badge tone="warning">Prototype · demo data</Badge>
      <span title="The demo runs on a fixed clock so the story stays consistent.">Demo clock: {label}</span>
    </div>
  );
}

function AccountPanel({ role }: { role: Role }) {
  const { session, signOut, resetDemo } = useAppStore();
  const navigate = useNavigate();
  const meta = roles[role];
  const initials = (session?.name ?? "")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);

  return (
    <div className="border-t border-line p-3">
      <div className="flex items-center gap-2.5 px-2 py-2">
        <div className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-100 text-[12px] font-semibold text-brand-800">
          {initials}
        </div>
        <div className="min-w-0 leading-tight">
          <div className="truncate text-[13px] font-medium text-ink">{session?.name}</div>
          <div className="text-[12px] text-ink-subtle">{meta.label}</div>
        </div>
      </div>
      <div className="mt-1 space-y-0.5">
        <AccountButton icon={Repeat} onClick={() => navigate("/login")}>
          Switch role
        </AccountButton>
        <AccountButton
          icon={RotateCw}
          onClick={() => {
            resetDemo();
            navigate("/login");
          }}
        >
          Reset demo
        </AccountButton>
        <AccountButton
          icon={LogOut}
          onClick={() => {
            signOut();
            navigate("/login");
          }}
        >
          Sign out
        </AccountButton>
      </div>
    </div>
  );
}

function AccountButton({ icon: Icon, onClick, children }: { icon: typeof LogOut; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13px] text-ink-muted hover:bg-sunken hover:text-ink"
    >
      <Icon aria-hidden className="size-3.5" />
      {children}
    </button>
  );
}

function BottomBar({ role, onMore }: { role: Role; onMore: () => void }) {
  const items = roles[role].nav.filter((i) => i.primary).slice(0, 4);
  const itemClass = "flex flex-1 flex-col items-center gap-0.5 pt-2 pb-1.5 text-[11px]";
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {items.map((item) => (
        <NavLink
          key={item.path}
          to={navHref(role, item)}
          end={item.path === ""}
          className={({ isActive }) => clsx(itemClass, isActive ? "font-medium text-brand-700" : "text-ink-subtle")}
        >
          <item.icon aria-hidden className="size-5" />
          {item.label}
        </NavLink>
      ))}
      <button type="button" onClick={onMore} className={clsx(itemClass, "text-ink-subtle")}>
        <Ellipsis aria-hidden className="size-5" />
        More
      </button>
    </nav>
  );
}

function Drawer({ role, onClose }: { role: Role; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <div className="absolute inset-0 bg-ink/30" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex w-[min(20rem,85vw)] flex-col bg-surface shadow-pop outline-none"
      >
        <div className="flex h-14 items-center justify-between border-b border-line px-4">
          <span className="text-sm font-semibold">Menu</span>
          <button type="button" aria-label="Close menu" onClick={onClose} className="grid size-9 place-items-center rounded-lg text-ink-muted hover:bg-sunken">
            <X aria-hidden className="size-5" />
          </button>
        </div>
        <div className="pt-3">
          <ClusterChip />
        </div>
        <nav aria-label="All sections" className="flex-1 overflow-y-auto p-3">
          <NavList role={role} items={roles[role].nav} />
        </nav>
        <AccountPanel role={role} />
      </div>
    </div>
  );
}

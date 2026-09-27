import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { ChevronLeft, ChevronRight, Presentation, RotateCw, X } from "lucide-react";
import type { Role } from "../../types";
import { useAppStore } from "../../store/AppStore";
import { Button } from "../../components/ui/Button";

// Guided demo following the competition demo order (spec §72).
interface Step {
  title: string;
  say: string;
  role: Role | null;
  path: string;
}

export const demoSteps: Step[] = [
  { title: "Log in as a farmer", role: null, path: "/login", say: "Six roles share one cluster. Start as Manjunath, a farmer with 2.5 acres in Varuna." },
  { title: "Farmer dashboard", role: "farmer", path: "/farmer", say: "The first screen answers one question: what needs my attention today?" },
  { title: "An intelligence recommendation", role: "farmer", path: "/farmer", say: "Open “Why this recommendation?” on the irrigation card — rain is 82% likely and soil moisture is already above the crop's need." },
  { title: "Water intelligence", role: "farmer", path: "/farmer/intelligence/water", say: "Today's irrigation plan, soil moisture against crop need, and last week's avoidable water use." },
  { title: "The reasoning — and the decision", role: "farmer", path: "/farmer/intelligence/water-delay-f27-1", say: "Every suggestion shows its data. The platform recommends, the farmer decides: accept to delay Field 1 by 24 hours." },
  { title: "Crops", role: "farmer", path: "/farmer/crops", say: "The cropping plan: Field 1 tomato is 7 days from harvest; Field 2's health index is falling." },
  { title: "A market opportunity", role: "farmer", path: "/farmer/market", say: "A buyer needs 35 t of Grade A tomato for 4–7 Oct — exactly when Field 1 is ready." },
  { title: "Upload the expected harvest", role: "farmer", path: "/farmer/market/upload?cycle=cc-27-1&requirement=br-1", say: "Offer the expected 3.2 t directly against that buyer's request, before harvest." },
  { title: "The buyer match", role: "buyer", path: "/buyer/requests", say: "The buyer sees Farm #27's offer — by farm label, not name — and can accept it." },
  { title: "Request machinery", role: "farmer", path: "/farmer/resources?tab=machinery", say: "Tractors are short tomorrow: 14 requests for 9 tractors. Request one from the shared pool." },
  { title: "Switch to the cluster dashboard", role: "cluster", path: "/cluster", say: "The coordinator sees all 128 farms: who still irrigates before rain, the tractor gap, supply against demand." },
  { title: "Cluster-level impact", role: "cluster", path: "/cluster/impact", say: "Pilot targets, the baseline comparison, and the activity created in this demo feeding the measures." },
];

const STORAGE_KEY = "agricluster:demo-guide";

interface GuideState {
  open: boolean;
  step: number;
  setOpen: (open: boolean) => void;
  goTo: (step: number) => void;
}

const GuideContext = createContext<GuideState | null>(null);

function load(): { open: boolean; step: number } {
  try {
    return { open: false, step: 0, ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") };
  } catch {
    return { open: false, step: 0 };
  }
}

export function DemoGuideProvider({ children }: { children: ReactNode }) {
  const [{ open, step }, setState] = useState(load);
  const { session } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ open, step }));
    } catch {
      /* storage unavailable — guide still works for this visit */
    }
  }, [open, step]);

  // A step that needs a different role navigates first and asks the destination's
  // route guard to switch roles (see RequireRole), so the page being left never
  // sees the new role and redirects away.
  const goTo = useCallback(
    (next: number) => {
      const s = demoSteps[Math.max(0, Math.min(next, demoSteps.length - 1))];
      setState((prev) => ({ ...prev, step: demoSteps.indexOf(s) }));
      navigate(s.path, s.role && session?.role !== s.role ? { state: { demoSwitchTo: s.role } } : undefined);
    },
    [session, navigate],
  );

  const value = useMemo(() => ({ open, step, setOpen: (o: boolean) => setState((p) => ({ ...p, open: o })), goTo }), [open, step, goTo]);
  return (
    <GuideContext.Provider value={value}>
      {children}
      {open && <GuidePanel />}
    </GuideContext.Provider>
  );
}

function useGuide(): GuideState {
  const g = useContext(GuideContext);
  if (!g) throw new Error("useGuide must be used inside <DemoGuideProvider>");
  return g;
}

/** Opens the guide. `compact` shows an icon-only button for the mobile header. */
export function DemoGuideButton({ compact = false, label = "Demo guide" }: { compact?: boolean; label?: string }) {
  const { open, setOpen } = useGuide();
  return (
    <Button
      variant={compact ? "ghost" : "secondary"}
      size="sm"
      aria-pressed={open}
      aria-label={compact ? label : undefined}
      icon={<Presentation aria-hidden className="size-4" />}
      onClick={() => setOpen(!open)}
      className={compact ? "size-9 px-0" : undefined}
    >
      {!compact && label}
    </Button>
  );
}

function GuidePanel() {
  const { step, goTo, setOpen } = useGuide();
  const { resetDemo } = useAppStore();
  const location = useLocation();
  const s = demoSteps[step];
  const here = location.pathname + location.search === s.path || (s.path === "/farmer" && location.pathname === "/farmer");
  const next = demoSteps[step + 1];

  return (
    <aside
      aria-label="Guided demo"
      className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 rounded-xl border border-line bg-surface shadow-pop sm:inset-x-auto sm:right-6 sm:w-96 lg:bottom-6"
    >
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
        <div className="text-[12px] font-medium text-ink-muted">
          Guided demo · step {step + 1} of {demoSteps.length}
        </div>
        <button type="button" aria-label="Close demo guide" onClick={() => setOpen(false)} className="grid size-7 place-items-center rounded-md text-ink-muted hover:bg-sunken">
          <X aria-hidden className="size-4" />
        </button>
      </div>
      <div className="px-4 py-3">
        <h2 className="text-[15px] font-semibold">{s.title}</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">{s.say}</p>
        {!here && (
          <Button size="sm" variant="secondary" className="mt-3" onClick={() => goTo(step)}>
            Go to this step
          </Button>
        )}
        <ol className="mt-3 flex gap-1" aria-label="Progress">
          {demoSteps.map((d, i) => (
            <li key={d.title} className="flex-1">
              <button
                type="button"
                aria-label={`Step ${i + 1}: ${d.title}`}
                aria-current={i === step ? "step" : undefined}
                onClick={() => goTo(i)}
                className={clsx("block h-1.5 w-full rounded-full", i < step ? "bg-brand-500" : i === step ? "bg-brand-800" : "bg-line")}
              />
            </li>
          ))}
        </ol>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-2.5">
        {step === 0 ? (
          <Button
            size="sm"
            variant="ghost"
            icon={<RotateCw aria-hidden className="size-3.5" />}
            onClick={() => {
              resetDemo();
              goTo(0);
            }}
          >
            Reset demo data
          </Button>
        ) : (
          <Button size="sm" variant="ghost" icon={<ChevronLeft aria-hidden className="size-4" />} onClick={() => goTo(step - 1)}>
            Back
          </Button>
        )}
        {next ? (
          <Button size="sm" onClick={() => goTo(step + 1)}>
            {next.title}
            <ChevronRight aria-hidden className="size-4" />
          </Button>
        ) : (
          <Button size="sm" onClick={() => setOpen(false)}>
            Finish
          </Button>
        )}
      </div>
    </aside>
  );
}
